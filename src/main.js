// Grão v0.1 — ponto de entrada. Liga documento, relógio, compositor riso, entrada e interface.

import { VERSION, BUILD, INKS, PAPERS, REPRINTS_PER_SECOND, PAPER_MM, DOC_W, hexToRgb } from './config.js';
import { sanitize } from './doc/project.js';
import { welcomeProject } from './doc/welcome.js';
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
import { videoFormat, recordSeconds, recordCanvas, fmtSeconds, planFrames } from './io/video.js';
import { GifWriter } from './io/gif.js';
import { makeZip } from './io/zip.js';
import { frameAtTick, printOrder, inkOf } from './doc/project.js';
import { rasterFrame } from './render/masks.js';
import { rebuildDirty } from './schedule.js';
import { createQuality } from './quality.js';
import { createView, fitView } from './view.js';

// Desalinhamento calibrado (#030): o papel equivale a um A4 deitado (297 mm). A riso aceita 2 a 3 mm entre cores;
// o controle no máximo desloca até 3 mm; o padrão (0,5) fica em ~1,5 mm.
const MAX_MIS_UV = 3 / PAPER_MM;
// Ângulo da retícula reticulada por tinta (padrão de riso, gera o moiré típico): 15°, 75°, 0°, 45°.
const SCREEN_ANGLES = [15, 75, 0, 45].map((a) => (a * Math.PI) / 180);
const A4_INCHES = PAPER_MM / 25.4;

async function start() {
  const glCanvas = document.getElementById('gl');
  const wetCanvas = document.getElementById('wet');
  const uiCanvas = document.getElementById('ui');

  const app = {
    version: VERSION,
    project: null,
    clock: new Clock(),
    selection: null,
    lassoHeld: false,
    tool: 'brush',          // 'brush' | 'eraser' | 'lasso' (pétala Ferramenta)
    historyUntil: 0,
    lowLatency: false,
    dirty: new Set(),
    view: createView(),     // zoom e posição do papel (só da sessão)
  };

  // Primeira vez no aparelho: projeto de boas-vindas com um loop tocando (#055).
  const saved = await loadProject();
  app.project = saved ? sanitize(saved) : welcomeProject();

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
  window.addEventListener('pagehide', () => app.saveNow());
  // Pede ao navegador para não apagar os projetos quando faltar espaço (#061). Sem resposta = segue igual.
  navigator.storage?.persist?.().catch(() => {});

  app.toast = (msg) => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(app.toast.t);
    app.toast.t = setTimeout(() => { el.hidden = true; }, 2500);
  };

  installActions(app);

  // Leitor de tela (#057): as leituras da roda ("Desfeito", "3/8"…) também vão para uma região aria-live.
  const live = document.createElement('div');
  live.className = 'sr-only';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('role', 'status');
  document.body.appendChild(live);
  app.announce = (t) => { live.textContent = t; };

  // Dicas da primeira vez (#055): uma vez por aparelho, em qualquer projeto, até a pessoa fazer as três coisas.
  // (Antes só no projeto de boas-vindas, e quem já tinha projeto nunca via: teste do Raphael, 24/11.)
  const HINTS_KEY = 'grao.dicas';
  let hintsDone = {};
  try { hintsDone = JSON.parse(localStorage.getItem(HINTS_KEY) || '{}'); } catch { hintsDone = { draw: true, wheel: true, time: true }; }
  app.hints = !(hintsDone.draw && hintsDone.wheel && hintsDone.time) ? { ...hintsDone } : null;
  app.resetHints = () => {
    app.hints = { draw: false, wheel: false, time: false };
    try { localStorage.removeItem(HINTS_KEY); } catch { /* sem armazenamento */ }
  };
  app.hintDone = (id) => {
    if (!app.hints || app.hints[id]) return;
    app.hints[id] = true;
    try { localStorage.setItem(HINTS_KEY, JSON.stringify(app.hints)); } catch { /* sem armazenamento */ }
    if (app.hints.draw && app.hints.wheel && app.hints.time) {
      app.hints = null;
      app.toast('Pronto. Para começar o seu: Menu → Novo projeto.');
    }
  };

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
  app.exportVideo = async ({ laps = 0 } = {}) => {
    if (app.recording || app.exporting) return;
    const format = videoFormat();
    if (!format) { app.toast('Este navegador não grava vídeo. Use o Chrome atualizado.'); return; }
    const seconds = recordSeconds(app.project, laps);
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

  // O canvas da GPU acompanha o tamanho do palco, na qualidade atual (#060).
  app.quality = createQuality();
  function resizeGl() {
    const r = glCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, app.quality.scale);
    glCanvas.width = Math.max(1, Math.round(r.width * dpr));
    glCanvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  new ResizeObserver(resizeGl).observe(glCanvas);
  resizeGl();

  // Desalinhamento: pequeno deslocamento por tinta, novo a cada reimpressão. v0.7 (#049): cresce com as passadas
  // (o papel passa de novo pela máquina a cada tinta): 1ª passada 45%, depois 70%, 88% e 100% do máximo.
  const PASS_FACTOR = [0.45, 0.7, 0.88, 1];
  function offsets(seed, amount, passOf = [0, 1, 2, 3]) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const a = hash(seed * 4 + i) * Math.PI * 2;
      const r = hash(seed * 4 + i + 0.5) * amount * MAX_MIS_UV * PASS_FACTOR[passOf[i]];
      out.push(Math.cos(a) * r, Math.sin(a) * r * 1.5); // 1,5 = proporção 3:2 em uv
    }
    return out;
  }

  // Parâmetros do compositor. Sem `at`: o tempo do relógio (tela). Com `at` (segundos): exportação — frame de cada
  // camada naquele tempo, semente do ferver pelo tempo (o GIF sai igual a cada exportação), sem papel-cebola.
  const DOTS = { round: 0, line: 1, ellipse: 2 };
  function drawParams(now, at = null, sep = -1) {
    const p = app.project;
    const s = p.settings;
    const order = printOrder(p);
    const passOf = [];
    order.forEach((d, i) => { passOf[d] = i; });
    const active = p.layers[p.activeLayer];
    const frameOf = (layer) => (at === null ? app.clock.frameOf(layer) : frameAtTick(layer, Math.floor(at * layer.fps + 1e-6)));
    const fa = frameOf(active);
    const n = active.frames.length;
    const seed = at === null ? app.clock.seed(now, REPRINTS_PER_SECOND, s.ferver) : (s.ferver ? Math.floor(at * REPRINTS_PER_SECOND) : 0);
    const paper = PAPERS[p.paper] || PAPERS.natural;
    return {
      layers: p.layers.map((layer) => ({
        mask: app.masks.get(layer.id, frameOf(layer)),
        ink: layer.ink,
        type: layer.screen.type === 'am' ? 1 : 0,
        density: layer.screen.density,
        dot: DOTS[layer.screen.dot] || 0,
        on: layer.visible,
      })),
      order,
      opaque: p.inks.map((i) => (INKS[i] || INKS[0]).opaque ?? 0.1),
      sep,
      flaws: [s.flaws?.rollers ? 1 : 0, s.flaws?.transfer ? 1 : 0],
      empty: app.masks.empty,
      prev: app.masks.get(active.id, (fa - 1 + n) % n),
      next: app.masks.get(active.id, (fa + 1) % n),
      prev2: app.masks.get(active.id, (fa - 2 + 2 * n) % n),
      next2: app.masks.get(active.id, (fa + 2) % n),
      onionW: onionWeights(s.onion, n),
      inks: p.inks.map((i) => hexToRgb((INKS[i] || INKS[0]).hex)),
      offsets: offsets(seed, s.mis, passOf),
      angles: SCREEN_ANGLES,
      cell: DOC_W / (s.lpi * A4_INCHES),       // lineatura: linhas de pontos por polegada no A4
      paper: { rgb: hexToRgb(paper.hex), fiber: paper.fiber, incl: paper.incl, tex: paper.tex },
      grain: s.grain,
      seed,
      onion: at === null && app.clock.frozen && n > 1,
      view: at === null ? app.view : { s: 1, ox: 0, oy: 0 },
    };
  }

  function draw(now) { riso.draw(drawParams(now)); }

  // ---------- Prova de impressão (v0.7, #051) ----------
  // O frame atual vira uma folha riso parada, em alta resolução (2400 × 1600), com as imperfeições ligadas no Menu.
  // Fecha a animação como um ritual: a folha aparece sozinha na tela, com nome, data e tintas.
  app.printProof = async () => {
    if (app.exporting || app.recording) return;
    app.exporting = true;
    app.ui?.collapse(); app.sheet?.close();
    let target = null;
    try {
      const at = app.clock.t;
      await flushMasks();
      const w = 2400, h = 1600;
      target = riso.createTarget(w, h);
      riso.draw(drawParams(performance.now(), at), target);
      const rgba = riso.read(target);
      const cv = Object.assign(document.createElement('canvas'), { width: w, height: h });
      cv.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0);
      const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
      showProof(blob);
    } catch (err) {
      console.warn('Grão: prova falhou', err);
      app.toast('Não deu para fazer a prova. Tente de novo.');
    } finally {
      if (target) riso.destroyTarget(target);
      app.exporting = false;
    }
  };

  // Deixa todas as máscaras prontas antes de exportar, respeitando o limite por quadro (o loop não para).
  async function flushMasks() {
    let guard = 600;
    while (app.dirty.size && guard-- > 0) { rebuildDirty(app, performance.now()); await nextFrame(); }
  }
  function showProof(blob) {
    const url = URL.createObjectURL(blob);
    const p = app.project;
    const used = [...new Set(p.layers.filter((L) => L.visible && L.frames.some((f) => f.length)).map((L) => inkOf(p, L).name))];
    const back = document.createElement('div');
    back.className = 'proof';
    back.innerHTML = `
      <figure class="proof-card">
        <img alt="Prova de impressão">
        <figcaption><b></b><span></span></figcaption>
        <div class="row"><button class="btn" data-act="save">Salvar prova (PNG)</button><button class="btn" data-act="close">Fechar</button></div>
      </figure>`;
    back.querySelector('img').src = url;
    back.querySelector('b').textContent = `Prova de impressão · ${p.name}`;
    back.querySelector('span').textContent = `${new Date().toLocaleDateString('pt-BR')} · ${used.join(', ') || 'sem tinta'} · ${PAPERS[p.paper].name}`;
    back.querySelector('[data-act="save"]').onclick = () => { downloadBlob(blob, `${baseNameFor(p)}_prova.png`); app.toast('Prova salva. Procure em Downloads.'); };
    back.querySelector('[data-act="close"]').onclick = () => { back.remove(); URL.revokeObjectURL(url); };
    document.body.appendChild(back);
  }

  // ---------- Separações para a gráfica (v0.7, #052) ----------
  // Um PNG em escala de cinza por tinta (preto = tinta, 5% a 100%), a 300 dpi num A4 (3508 × 2339), com o nome da
  // tinta no arquivo, num .zip. Sem grão e sem retícula: a riso faz a retícula dela. Frame atual de cada camada.
  app.exportSeparations = async () => {
    if (app.exporting || app.recording) return;
    app.exporting = true;
    app.ui?.collapse(); app.sheet?.close();
    const p = app.project, name = baseNameFor(p);
    const scale = 3508 / DOC_W;
    // Frame de cada camada fixado agora: o loop continua tocando durante a separação, e todas as tintas precisam
    // sair do mesmo instante (senão as chapas não registram).
    const frameAt = p.layers.map((L) => app.clock.frameOf(L));
    try {
      const files = [];
      const drums = [...new Set(p.layers.filter((L) => L.visible).map((L) => L.ink))].sort();
      app.toast(`Separando ${drums.length} tinta${drums.length > 1 ? 's' : ''}. Espere terminar.`);
      for (const d of drums) {
        let acc = null, w = 0, h = 0;
        for (let l = 0; l < p.layers.length; l++) {
          const L = p.layers[l];
          if (!L.visible || L.ink !== d) continue;
          await nextFrame();
          const r = rasterFrame(p, l, frameAt[l], scale);
          w = r.w; h = r.h;
          acc = acc || new Uint8ClampedArray(w * h);
          const dens = L.screen.density;
          for (let i = 0, j = 0; i < acc.length; i++, j += 4) { const v = r.data[j] * dens; if (v > acc[i]) acc[i] = v; }
        }
        if (!acc) continue;
        const img = new ImageData(w, h);
        for (let i = 0, j = 0; i < acc.length; i++, j += 4) {
          const v = acc[i] < 13 ? 0 : acc[i];          // abaixo de 5% a riso não imprime
          img.data[j] = img.data[j + 1] = img.data[j + 2] = 255 - v; img.data[j + 3] = 255;
        }
        const cv = Object.assign(document.createElement('canvas'), { width: w, height: h });
        cv.getContext('2d').putImageData(img, 0, 0);
        await nextFrame();
        const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
        const ink = (INKS[p.inks[d]] || INKS[0]).name.normalize('NFD').replace(/[^A-Za-z0-9 ]/g, '').replace(/ +/g, '-');
        files.push({ name: `${name}_tinta${d + 1}_${ink}_300dpi.png`, data: new Uint8Array(await blob.arrayBuffer()) });
      }
      downloadBlob(new Blob([makeZip(files)], { type: 'application/zip' }), `${name}_separacoes.zip`);
      app.toast('Separações exportadas. Procure em Downloads.');
    } catch (err) {
      console.warn('Grão: separações falharam', err);
      app.toast('Não deu para separar as tintas. Tente de novo.');
    } finally {
      app.exporting = false;
    }
  };

  // Exportação quadro a quadro (#044, #045, #046): desenha cada quadro fora da tela, um por quadro da tela (o loop
  // continua), e monta o GIF ou o .zip de PNGs. Papel e roda ficam esperando (como na gravação de vídeo).
  const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
  app.exporting = false;
  app.exportAnimation = async (format, { scale = 0.5, laps = 0 } = {}) => {
    if (app.exporting || app.recording) return;
    app.exporting = true;
    let target = null;
    try {
      app.selection = null; app.onSelectionChange(); app.ui?.collapse(); app.sheet?.close();
      await flushMasks();                     // todas as máscaras prontas, sem travar o loop
      const plan = planFrames(app.project, laps);
      const w = Math.round(DOC_W * scale), h = Math.round((DOC_W * scale * 2) / 3);
      target = riso.createTarget(w, h);
      const name = baseNameFor(app.project);
      app.toast(`Exportando ${plan.count} quadros. Espere terminar.`);
      const gif = format === 'gif' ? new GifWriter(w, h) : null;
      const files = [];
      const cv = format === 'png' ? Object.assign(document.createElement('canvas'), { width: w, height: h }) : null;
      for (let i = 0; i < plan.count; i++) {
        await nextFrame();
        riso.draw(drawParams(performance.now(), plan.times[i]), target);
        const rgba = riso.read(target);
        if (gif) gif.addFrame(rgba, plan.delayCs);
        else {
          cv.getContext('2d').putImageData(new ImageData(rgba, w, h), 0, 0);
          const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
          files.push({ name: `${name}_${String(i + 1).padStart(4, '0')}.png`, data: new Uint8Array(await blob.arrayBuffer()) });
        }
        if (i % 6 === 0) app.ui?.say(`${Math.round((100 * (i + 1)) / plan.count)}%`);
      }
      if (gif) downloadBlob(new Blob([gif.finish()], { type: 'image/gif' }), `${name}.gif`);
      else downloadBlob(new Blob([makeZip(files)], { type: 'application/zip' }), `${name}_png.zip`);
      app.toast(`${gif ? 'GIF exportado' : 'PNGs exportados'}. Procure em Downloads.`);
    } catch (err) {
      console.warn('Grão: exportação falhou', err);
      app.toast('Não deu para exportar. Tente uma escala menor ou menos voltas.');
    } finally {
      if (target) riso.destroyTarget(target);
      app.exporting = false;
    }
  };

  // Papel-cebola (#040): até 2 frames antes e 2 depois; o segundo com metade da intensidade.
  function onionWeights(o, n) {
    const k = o?.strength ?? 0.4;
    const w = (count, depth) => (count >= depth && n > depth ? (depth === 1 ? k : k * 0.5) : 0);
    return [w(o?.before ?? 1, 1), w(o?.before ?? 1, 2), w(o?.after ?? 1, 1), w(o?.after ?? 1, 2)];
  }

  let last = performance.now();
  function frame(now) {
    const dtMs = now - last;
    const dt = Math.min(0.1, dtMs / 1000);
    last = now;
    // durante gravação/exportação a qualidade não muda (o vídeo mudaria de tamanho no meio)
    if (!app.recording && !app.exporting && app.quality.sample(dtMs, app.project.settings.autoQuality !== false)) resizeGl();
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

  // Abrir sem internet (#035). Só em https (GitHub Pages) ou localhost: o navegador não aceita em http da rede.
  app.updateReady = null;
  app.applyUpdate = () => {
    if (!app.updateReady) return;
    app.updateRequested = true;
    app.updateReady.postMessage('atualizar');
  };
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const check = () => { if (reg.waiting && navigator.serviceWorker.controller) app.updateReady = reg.waiting; };
      check();
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w?.addEventListener('statechange', () => { if (w.state === 'installed') check(); });
      });
    }).catch((err) => console.warn('Grão: service worker não registrou', err));
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!app.updateRequested || reloading) return;   // só recarrega depois do toque no aviso
      reloading = true;
      Promise.resolve(app.saveNow()).finally(() => location.reload());
    });
  }

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
