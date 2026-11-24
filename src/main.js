// Grão v0.1 — ponto de entrada. Liga documento, relógio, compositor riso, entrada e interface.

import { VERSION, INKS, PAPERS, REPRINTS_PER_SECOND, hexToRgb } from './config.js';
import { newProject, sanitize, cloneStroke } from './doc/project.js';
import { History } from './doc/history.js';
import { Clock } from './clock/clock.js';
import { Masks } from './render/masks.js';
import { createRiso } from './render/riso/riso.js';
import { setupInput } from './input/input.js';
import { setupThumbZone } from './ui/thumbzone.js';
import { setupDebug } from './ui/debug.js';
import { loadProject, saveProject, debounced } from './io/storage.js';

const MAX_MIS_UV = 0.004; // desalinhamento máximo (fração da largura) com o controle no máximo

async function start() {
  const glCanvas = document.getElementById('gl');
  const wetCanvas = document.getElementById('wet');
  const thumbRoot = document.getElementById('thumb');

  const app = {
    version: VERSION,
    project: sanitize(await loadProject()),
    clock: new Clock(),
    selection: null,
    lassoHeld: false,
    cutTool: false,
    historyUntil: 0,
    lowLatency: false,
    dirty: new Set(),
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
  const saveNow = () => saveProject(app.project).catch((err) => app.toast('Não consegui salvar: ' + err.message));
  app.requestSave = debounced(saveNow, 600);
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveNow(); });

  app.toast = (msg) => {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(app.toast.t);
    app.toast.t = setTimeout(() => { el.hidden = true; }, 2500);
  };

  app.undo = () => { if (app.history.undo()) app.onSelectionChange(); };
  app.redo = () => { if (app.history.redo()) app.onSelectionChange(); };

  // Auto: com o loop parado, cada traço terminado avança um frame (desenho quadro a quadro).
  app.onStrokeCommitted = () => {
    const c = app.clock;
    if (app.project.settings.auto && c.paused && c.holds.size === 0) {
      c.step(app.project.layers[app.project.activeLayer], 1);
    }
  };

  // Uma seleção segura o loop parado, como o Laço: o desenho não foge enquanto você o ajusta.
  app.onSelectionChange = () => {
    if (app.selection) app.clock.holds.add('selection');
    else app.clock.holds.delete('selection');
    input.redrawOverlay();
  };

  app.duplicateSelectionToNextFrame = () => {
    const sel = app.selection;
    if (!sel) return;
    const layer = app.project.layers[sel.l];
    const src = layer.frames[sel.f].filter((s) => sel.ids.has(s.id));
    const nf = (sel.f + 1) % layer.frames.length;
    const before = layer.frames[nf].slice();
    const copies = src.map((s) => cloneStroke(s, app.project.nextId++));
    layer.frames[nf] = before.concat(copies);
    app.history.push({ l: sel.l, f: nf, before, after: layer.frames[nf].slice() });
    app.markDirty(sel.l, nf);
    app.clock.step(layer, 1);
    app.selection = { l: sel.l, f: nf, ids: new Set(copies.map((s) => s.id)) };
    app.onSelectionChange();
    app.requestSave();
  };

  app.deleteSelection = () => {
    const sel = app.selection;
    if (!sel) return;
    const layer = app.project.layers[sel.l];
    const before = layer.frames[sel.f].slice();
    layer.frames[sel.f] = before.filter((s) => !sel.ids.has(s.id));
    app.history.push({ l: sel.l, f: sel.f, before, after: layer.frames[sel.f].slice() });
    app.markDirty(sel.l, sel.f);
    app.selection = null;
    app.onSelectionChange();
    app.requestSave();
  };

  app.newProject = () => {
    app.project = newProject(app.project.paper);
    app.masks.clear();
    app.history = new History(app);
    app.selection = null;
    app.clock.t = 0;
    app.onSelectionChange();
    thumb.rebuild();
    saveNow();
  };

  app.exportPNG = () => {
    draw(performance.now());               // desenha e lê no mesmo instante (o buffer ainda existe)
    const url = glCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `grao-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.png`;
    a.click();
  };

  const thumb = setupThumbZone(app, thumbRoot);
  app.debug = setupDebug(app, thumb.debugBox);
  const input = setupInput(app, wetCanvas);

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
    });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    app.clock.tick(dt);
    for (const k of app.dirty) {
      const [l, f] = k.split(':').map(Number);
      const layer = app.project.layers[l];
      if (layer && f < layer.frames.length) app.masks.rebuild(l, f, layer.frames[f]);
    }
    app.dirty.clear();
    draw(now);
    thumb.update();
    app.debug.frame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.grao = app; // para inspecionar pelo console durante os testes
}

function hash(x) {
  const s = Math.sin(x * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function fail(msg) {
  document.body.innerHTML = `<div class="fail"><h1>Grão não abriu</h1><p>${msg}</p>
    <p>Use o Chrome atualizado no tablet. Se o problema continuar, anote esta mensagem.</p></div>`;
}

start();
