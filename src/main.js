// Grão v0.1 — ponto de entrada. Liga documento, relógio, compositor riso, entrada e interface.

import { VERSION, BUILD, INKS, PAPERS, REPRINTS_PER_SECOND, hexToRgb } from './config.js';
import { sanitize } from './doc/project.js';
import { installActions } from './actions.js';
import { History } from './doc/history.js';
import { Clock } from './clock/clock.js';
import { Masks } from './render/masks.js';
import { createRiso } from './render/riso/riso.js';
import { setupInput } from './input/input.js';
import { setupWheel } from './ui/wheel.js';
import { setupSheet } from './ui/sheet.js';
import { setupDebug } from './ui/debug.js';
import { loadProject, saveProject, debounced } from './io/storage.js';
import { downloadBlob, baseNameFor } from './io/file.js';
import { videoFormat, recordSeconds, recordCanvas, fmtSeconds } from './io/video.js';
import { rebuildDirty } from './schedule.js';
import { createView, fitView } from './view.js';

const MAX_MIS_UV = 0.004; // desalinhamento máximo (fração da largura) com o controle no máximo

async function start() {
  const glCanvas = document.getElementById('gl');
  const wetCanvas = document.getElementById('wet');
  const uiCanvas = document.getElementById('ui');

  const app = {
    version: VERSION,
    project: sanitize(await loadProject()),
    clock: new Clock(),
    selection: null,
    lassoHeld: false,
    tool: 'brush',          // 'brush' | 'eraser' | 'lasso' (pétala Ferramenta)
    historyUntil: 0,
    lowLatency: false,
    dirty: new Set(),
    view: createView(),     // zoom e posição do papel (só da sessão)
  };

  let riso;
  try {
    riso = await createRiso(glCanvas);
  } catch (err) {
    fail(err.message);
    return;
  }
  app.riso = riso;
  app.masks = new Masks(riso.gl);
  app.history = new History(app);

  app.markDirty = (l, f) => app.dirty.add(`${l}:${f}`);
  // Salvamento automático no navegador. O Menu mostra "Salvando…" / "Salvo neste aparelho às 14:32".
  app.savedAt = 0;
  app.unsaved = false;
  app.saveError = false;
  let saveGen = 0;                          // mudanças pedidas; um salvamento antigo não apaga o "Salvando…" novo
  app.saveNow = () => {
    const gen = saveGen;
    return saveProject(app.project).then(() => {
      app.savedAt = Date.now();
      if (gen === saveGen) app.unsaved = false;
      app.saveError = false;
      app.sheet?.refreshStatus();
    }).catch(() => {
    app.saveError = true;
    app.sheet?.refreshStatus();
      app.toast('Não deu para salvar. O navegador recusou o espaço. Salve um arquivo para garantir.');
    });
  };
  const saveLater = debounced(app.saveNow, 600);
  app.requestSave = () => { saveGen++; app.unsaved = true; saveLater(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) app.saveNow(); });

  app.toast = (msg) => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(app.toast.t);
    app.toast.t = setTimeout(() => { el.hidden = true; }, 2500);
  };

  installActions(app);

  app.exportPNG = () => {
    const view = { ...app.view };
    fitView(app.view);                     // exporta o papel inteiro, mesmo com zoom
    draw(performance.now());               // desenha e copia no mesmo instante (o buffer ainda existe)
    Object.assign(app.view, view);
    glCanvas.toBlob((blob) => {
      if (!blob) { app.toast('Não deu para exportar o PNG. Tente de novo.'); return; }
      downloadBlob(blob, `${baseNameFor(app.project)}.png`);
      app.toast('PNG exportado');
    }, 'image/png');
  };

  // Exportar vídeo: grava o loop tocando desde o frame 1, na velocidade 1×, por ciclos inteiros.
  app.recording = false;
  app.canRecordVideo = !!videoFormat();
  app.exportVideo = async () => {
    if (app.recording) return;
    const format = videoFormat();
    if (!format) { app.toast('Este navegador não grava vídeo. Use o Chrome atualizado.'); return; }
    const seconds = recordSeconds(app.project);
    const c = app.clock;
    const saved = { paused: c.paused, speed: c.speed, view: { ...app.view } };
    fitView(app.view);                      // o vídeo mostra o papel inteiro
    app.selection = null;
    app.onSelectionChange();
    app.ui?.collapse();
    app.sheet?.close();
    c.holds.clear();                        // nada segura o loop durante a gravação (papel e roda ficam bloqueados)
    c.paused = false; c.speed = 1; c.t = 1e-4;
    app.recording = true;
    app.toast(`Gravando o loop: ${fmtSeconds(seconds)}. Espere terminar.`);
    try {
      const blob = await recordCanvas(glCanvas, seconds, format);
      downloadBlob(blob, `${baseNameFor(app.project)}.${format.ext}`);
      app.toast(`Vídeo exportado (${format.ext.toUpperCase()}). Procure em Downloads.`);
    } catch (err) {
      console.warn('Grão: gravação de vídeo falhou', err);
      app.toast('Não deu para gravar o vídeo. Tente de novo ou exporte um PNG.');
    } finally {
      app.recording = false;
      c.paused = saved.paused; c.speed = saved.speed;
      Object.assign(app.view, saved.view);
      app.input?.redrawOverlay();
    }
  };

  // Painel "Teste da Fase 0": flutua no canto oposto à roda (a roda escolhe o canto).
  const debugBox = document.createElement('pre');
  debugBox.className = 'debug';
  debugBox.hidden = true;
  document.body.appendChild(debugBox);
  app.debug = setupDebug(app, debugBox);
  app.sheet = setupSheet(app);
  app.ui = setupWheel(app, uiCanvas);
  const input = setupInput(app, wetCanvas);
  app.input = input;

  app.masks.rebuildAll(app.project);

  // O canvas da GPU acompanha o tamanho do palco.
  function resizeGl() {
    const r = glCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    glCanvas.width = Math.max(1, Math.round(r.width * dpr));
    glCanvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  new ResizeObserver(resizeGl).observe(glCanvas);
  resizeGl();

  // Desalinhamento: pequeno deslocamento por tinta, novo a cada reimpressão.
  function offsets(seed, amount) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const a = hash(seed * 4 + i) * Math.PI * 2;
      const r = hash(seed * 4 + i + 0.5) * amount * MAX_MIS_UV;
      out.push(Math.cos(a) * r, Math.sin(a) * r * 1.5); // 1,5 = proporção 3:2 em uv
    }
    return out;
  }

  function draw(now) {
    const p = app.project;
    const s = p.settings;
    const active = p.layers[p.activeLayer];
    const fa = app.clock.frameOf(active);
    const n = active.frames.length;
    const seed = app.clock.seed(now, REPRINTS_PER_SECOND, s.ferver);
    const paper = PAPERS[p.paper] || PAPERS.natural;
    riso.draw({
      masks: p.layers.map((layer, l) => app.masks.get(l, app.clock.frameOf(layer))),
      prev: app.masks.get(p.activeLayer, (fa - 1 + n) % n),
      next: app.masks.get(p.activeLayer, (fa + 1) % n),
      inks: p.layers.map((layer) => hexToRgb(INKS[layer.ink].hex)),
      opac: [1, 1, 1, 1],
      offsets: offsets(seed, s.mis),
      paper: { rgb: hexToRgb(paper.hex), fiber: paper.fiber, incl: paper.incl, tex: paper.tex },
      grain: s.grain,
      seed,
      onion: app.clock.frozen && n > 1,
      view: app.view,
    });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    app.clock.tick(dt);
    rebuildDirty(app, now);
    draw(now);
    app.ui.update();
    app.debug.frame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Fase de testes: confirma qual versão o tablet está rodando (o Chrome guarda cópias antigas).
  app.toast(`Grão ${VERSION}-${BUILD}`);

  // Novidade mostrada uma vez por aparelho, no botão da roda (#025).
  try {
    if (!localStorage.getItem('grao.novo.gesto-tempo')) {
      localStorage.setItem('grao.novo.gesto-tempo', '1');
      setTimeout(() => app.ui.say('Novo: 2 dedos para os lados andam no tempo', 3000), 2700);
    }
  } catch { /* sem armazenamento: não mostra */ }

  window.grao = app; // para inspecionar pelo console durante os testes
}

function hash(x) {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function fail(msg) {
  document.body.innerHTML = `<div class="fail"><h1>O Grão não abriu</h1><p>${msg}</p></div>`;
}

start();
