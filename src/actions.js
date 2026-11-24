// Ações do app que mexem no documento e no tempo: desfazer, seleção, projeto novo, abrir arquivo.
// Ficam fora do main.js para o teste de lógica (tests/logic_test.mjs) usar exatamente o mesmo código.
// Regras (CLAUDE.md): mudou traços de um frame → history.push + markDirty + requestSave; mudou a seleção →
// onSelectionChange; traço que entrou no histórico nunca é alterado no lugar (troca por cloneStroke).

import { newProject, cloneStroke, newLayer, MAX_LAYERS, DRUMS, SCREEN_TYPES, DENSITY_MIN, inkOf } from './doc/project.js';
import { INKS } from './config.js';
import { History } from './doc/history.js';
import { markAll } from './schedule.js';

// Tintas prontas (#029): falso CMYK da riso = Azul, Vermelho vivo, Amarelo, Preto.
export const FALSE_CMYK = [1, 8, 2, 3];

export function installActions(app) {
  app.undo = () => {
    const ok = app.history.undo();
    if (ok) app.onSelectionChange();
    app.ui?.say(ok ? 'Desfeito' : 'Nada para desfazer');
    return ok;
  };
  app.redo = () => {
    const ok = app.history.redo();
    if (ok) app.onSelectionChange();
    app.ui?.say(ok ? 'Refeito' : 'Nada para refazer');
    return ok;
  };

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
    app.input?.redrawOverlay();
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

  // Troca o projeto inteiro (novo ou aberto de um arquivo). O histórico recomeça: desfazer não volta ao anterior.
  app.replaceProject = (project) => {
    app.project = project;
    app.masks.clear();
    app.dirty.clear();
    markAll(app);                           // as máscaras voltam aos poucos, sem travar o loop (schedule.js)
    app.history = new History(app);
    app.selection = null;
    app.clock.t = 0;
    app.onSelectionChange();
    app.ui?.rebuild();
    app.saveNow?.();
  };

  // ---------- camadas (v0.4, #028) ----------
  const cloneLayer = (L) => ({ ...L, frames: L.frames.slice(), screen: { ...L.screen } });
  const snapshot = () => ({
    inks: app.project.inks.slice(), activeLayer: app.project.activeLayer, layers: app.project.layers.map(cloneLayer),
  });
  app.layerSnapshot = snapshot;

  // Volta tintas e camadas a um retrato (desfazer/refazer). As máscaras são guardadas pelo id da camada, então
  // só falta refazer as que sumiram (camada apagada e depois desfeita) e os baldes (paredes mudam).
  app.restoreLayers = (snap) => {
    const p = app.project;
    p.inks = snap.inks.slice();
    p.layers = snap.layers.map(cloneLayer);
    p.activeLayer = Math.min(snap.activeLayer, p.layers.length - 1);
    app.selection = null;
    app.onSelectionChange();
    app.masks.prune?.(p);
    markAll(app);
    app.requestSave();
  };

  // Registra no desfazer uma mudança de camadas já feita, a partir do retrato de antes.
  app.commitLayers = (before) => {
    app.history.push({ type: 'layers', before, after: snapshot() });
    app.requestSave();
  };

  function layerOp(fn) {
    const before = snapshot();
    if (fn() === false) return false;
    app.selection = null;
    app.onSelectionChange();
    app.commitLayers(before);
    return true;
  }

  const L = (i) => app.project.layers[i];

  // Nova camada logo acima da ativa, na mesma tinta e com o mesmo tempo.
  app.addLayer = () => layerOp(() => {
    const p = app.project;
    if (p.layers.length >= MAX_LAYERS) { app.toast('Máximo de 8 camadas.'); return false; }
    const a = L(p.activeLayer);
    const layer = newLayer(p, a.ink, a.fps, a.frames.length);
    p.layers.splice(p.activeLayer + 1, 0, layer);
    p.activeLayer += 1;
    return true;
  });

  app.deleteLayer = (i) => layerOp(() => {
    const p = app.project;
    if (p.layers.length <= 1) { app.toast('A última camada não pode ser apagada.'); return false; }
    p.layers.splice(i, 1);
    p.activeLayer = Math.max(0, Math.min(p.activeLayer > i ? p.activeLayer - 1 : p.activeLayer, p.layers.length - 1));
    app.masks.prune?.(p);
    markAll(app, true);                     // baldes de outras camadas perderam uma parede
    return true;
  });

  // dir = +1 sobe (imprime depois), -1 desce.
  app.moveLayer = (i, dir) => layerOp(() => {
    const p = app.project, j = i + dir;
    if (j < 0 || j >= p.layers.length) return false;
    [p.layers[i], p.layers[j]] = [p.layers[j], p.layers[i]];
    if (p.activeLayer === i) p.activeLayer = j; else if (p.activeLayer === j) p.activeLayer = i;
    return true;
  });

  app.duplicateLayer = (i) => layerOp(() => {
    const p = app.project;
    if (p.layers.length >= MAX_LAYERS) { app.toast('Máximo de 8 camadas.'); return false; }
    const src = L(i);
    const copy = { ...cloneLayer(src), id: p.nextLayerId++, frames: src.frames.map((fr) => fr.map((s) => cloneStroke(s, p.nextId++))) };
    p.layers.splice(i + 1, 0, copy);
    p.activeLayer = i + 1;
    copy.frames.forEach((fr, f) => { if (fr.length) app.markDirty(i + 1, f); });
    markAll(app, true);
    return true;
  });

  app.setLayerInk = (i, drum) => layerOp(() => {
    if (!(drum >= 0 && drum < DRUMS) || L(i).ink === drum) return false;
    L(i).ink = drum;
    return true;
  });
  app.toggleLayerVisible = (i) => layerOp(() => { L(i).visible = !L(i).visible; });
  app.toggleLayerLock = (i) => layerOp(() => { L(i).locked = !L(i).locked; });
  app.setLayerScreen = (i, screen) => layerOp(() => {
    const sc = L(i).screen;
    const type = SCREEN_TYPES.includes(screen.type) ? screen.type : sc.type;
    const density = Number.isFinite(screen.density) ? Math.min(1, Math.max(DENSITY_MIN, screen.density)) : sc.density;
    if (type === sc.type && density === sc.density) return false;
    L(i).screen = { type, density };
    return true;
  });

  // Cor do tambor (vale para todas as camadas que imprimem com ele).
  app.setDrumColor = (drum, inkIndex) => layerOp(() => {
    const p = app.project;
    if (!(inkIndex >= 0 && inkIndex < INKS.length) || p.inks[drum] === inkIndex) return false;
    p.inks[drum] = inkIndex;
    return true;
  });

  // Tintas prontas: troca as 4 de uma vez (os desenhos ficam). "Do projeto" volta ao que estava antes.
  app.inksBeforePreset = null;
  app.applyFalseCmyk = () => {
    const before = app.project.inks.slice();
    if (layerOp(() => { if (before.join() === FALSE_CMYK.join()) return false; app.project.inks = FALSE_CMYK.slice(); return true; })) {
      app.inksBeforePreset = before;
      app.ui?.say('Falso CMYK');
    }
  };
  app.restoreProjectInks = () => {
    const back = app.inksBeforePreset;
    if (!back) return;
    if (layerOp(() => { app.project.inks = back.slice(); return true; })) app.inksBeforePreset = null;
  };

  // Leitura do tempo: "3/8"; com mais de 4 camadas, "C2 · 3/8" (#031).
  app.frameLabel = (layer = L(app.project.activeLayer)) => {
    const p = app.project;
    const i = p.layers.indexOf(layer);
    const f = `${app.clock.frameOf(layer) + 1}/${layer.frames.length}`;
    return p.layers.length > 4 ? `C${i + 1} · ${f}` : f;
  };
  app.inkOf = (layer) => inkOf(app.project, layer);
  app.markAllFills = () => markAll(app, true);

  app.newProject = () => {
    const p = newProject(app.project.paper);
    p.settings = { ...p.settings, lefty: app.project.settings.lefty, wheelCorner: app.project.settings.wheelCorner };
    app.replaceProject(p);
  };
}
