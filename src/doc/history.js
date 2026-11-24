// Pilha de desfazer. Dois tipos de passo:
// - frame:   { l, f, before, after } — listas rasas de traços de um frame;
// - camadas: { type: 'layers', before, after } — retratos das tintas e camadas (criar, apagar, reordenar,
//            tinta, cor do tambor, visível, travar, retícula). Ver app.restoreLayers em actions.js.
// - frames:  { type: 'frames', l, before, after } — lista de frames e exposição de uma camada (inserir,
//            duplicar, apagar, mover frame, exposição). Ver app.restoreFrames.
// Traços nunca são alterados no lugar depois de entrar numa ação: transformações trocam
// o objeto por um clone, então os "antes" continuam válidos. A pilha é linear: um passo só é desfeito
// depois dos que vieram depois dele, então os índices de camada de cada passo continuam valendo.

export class History {
  constructor(app) {
    this.app = app;
    this.undoStack = [];
    this.redoStack = [];
  }

  // a = { l, f, before: [...], after: [...] }
  push(a) {
    this.undoStack.push(a);
    if (this.undoStack.length > 300) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  undo() {
    const a = this.undoStack.pop();
    if (!a) return false;
    this.#apply(a, a.before);
    this.redoStack.push(a);
    return true;
  }

  redo() {
    const a = this.redoStack.pop();
    if (!a) return false;
    this.#apply(a, a.after);
    this.undoStack.push(a);
    return true;
  }

  get depth() { return this.undoStack.length; }
  get canUndo() { return this.undoStack.length > 0; }
  get canRedo() { return this.redoStack.length > 0; }

  #apply(a, list) {
    if (a.type === 'layers') { this.app.restoreLayers(list); return; }
    if (a.type === 'frames') { this.app.restoreFrames(a.l, list); return; }
    const layer = this.app.project.layers[a.l];
    if (!layer || a.f >= layer.frames.length) return;
    layer.frames[a.f] = list.slice();
    this.app.selection = null;
    this.app.markDirty(a.l, a.f);
    this.app.requestSave();
  }
}
