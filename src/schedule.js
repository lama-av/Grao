// Quando refazer as máscaras (chamado a cada quadro pelo main.js). Fica fora de render/ porque olha o estado da
// entrada (transformação em andamento). O loop nunca para (decisão 7):
// - no máximo ~8 ms de trabalho por quadro; o resto fica para os próximos quadros;
// - frame com balde sendo movido/girado é refeito no máximo a cada 120 ms (o balde custa caro);
// - balde usa linhas de outras tintas como parede: se uma delas muda, o frame do balde é refeito também;
// - mudou FPS ou quantidade de frames: as paredes mudam de lugar no tempo, todos os baldes são refeitos.

import { fillDependents } from './doc/project.js';

const BUDGET_MS = 8;
const FILL_THROTTLE_MS = 120;

const keyOf = (l, f) => `${l}:${f}`;
const parse = (k) => k.split(':').map(Number);
const hasFill = (fr) => fr.some((s) => s.kind === 'fill');

export function timingSignature(project) {
  return project.layers.map((L) => `${L.fps}/${L.frames.length}/${(L.expo || []).join('')}`).join(',');
}

export function markAll(app, onlyFills = false) {
  app.project.layers.forEach((L, l) => L.frames.forEach((fr, f) => {
    if (fr.length && (!onlyFills || hasFill(fr))) app.dirty.add(keyOf(l, f));
  }));
}

export function rebuildDirty(app, now = performance.now(), clock = () => performance.now()) {
  const p = app.project;
  const sig = timingSignature(p);
  if (app.timingSig !== undefined && sig !== app.timingSig) markAll(app, true);
  app.timingSig = sig;
  if (!app.dirty.size) return 0;

  for (const k of [...app.dirty]) {
    const [l, f] = parse(k);
    for (const d of fillDependents(p, l, f)) app.dirty.add(keyOf(d.l, d.f));
  }

  const t0 = clock();
  let done = 0;
  for (const k of [...app.dirty]) {
    const [l, f] = parse(k);
    const layer = p.layers[l];
    if (!layer || f >= layer.frames.length) { app.dirty.delete(k); continue; }
    const fr = layer.frames[f];
    const fill = hasFill(fr);
    if (fill && app.input?.transforming && now - (app.lastFillRebuild || 0) < FILL_THROTTLE_MS) continue;
    if (done && clock() - t0 > BUDGET_MS) break;
    app.masks.rebuild(l, f, fr, p);
    app.dirty.delete(k);
    done++;
    if (fill) app.lastFillRebuild = now;
  }
  return done;
}
