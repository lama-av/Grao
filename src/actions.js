// Ações do app que mexem no documento e no tempo: desfazer, seleção, projeto novo, abrir arquivo.
// Ficam fora do main.js para o teste de lógica (tests/logic_test.mjs) usar exatamente o mesmo código.
// Regras (CLAUDE.md): mudou traços de um frame → history.push + markDirty + requestSave; mudou a seleção →
// onSelectionChange; traço que entrou no histórico nunca é alterado no lugar (troca por cloneStroke).

import { newProject, cloneStroke } from './doc/project.js';
import { History } from './doc/history.js';
import { markAll } from './schedule.js';

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

  app.newProject = () => {
    const p = newProject(app.project.paper);
    p.settings = { ...p.settings, lefty: app.project.settings.lefty, wheelCorner: app.project.settings.wheelCorner };
    app.replaceProject(p);
  };
}
