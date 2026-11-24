// Documento: projeto, tintas (camadas), frames e traços.
// Só traços são salvos; máscaras são cache (ver docs/04-design-sistema-v0.1.md).

import { DEFAULT_FRAMES, DEFAULT_INKS, INKS, PAPERS, FPS_OPTIONS, MAX_FRAMES } from '../config.js';

const LAYERS = 4;                         // o compositor riso mistura exatamente 4 tintas

// Ferramentas com tamanho próprio (unidades do documento) e o intervalo do arco de Tamanho.
export const DEFAULT_SIZES = { brush: 10, pencil: 6, marker: 16, chalk: 14, eraser: 20 };
export const SIZE_MIN = 2, SIZE_MAX = 40;
const INK_BRUSHES = ['pencil', 'marker', 'chalk'];

export function newProject(paper = 'natural') {
  return {
    format: 'grao-projeto',
    version: 1,
    created: new Date().toISOString(),
    name: 'Sem título',
    paper,
    nextId: 1,
    activeLayer: 0,
    layers: DEFAULT_INKS.map((ink) => ({
      ink,
      fps: 8,
      frames: Array.from({ length: DEFAULT_FRAMES }, () => []),
    })),
    // wheelCorner: null = automático (inferior esquerdo; inferior direito no modo Canhoto)
    // sizes: tamanho de cada ferramenta (T-021). smooth: suavização do traço, 0 = desligada (decisão 6, T-025).
    settings: {
      grain: 0.6, mis: 0.5, ferver: true, auto: true, lefty: false, wheelCorner: null, pinWheel: false,
      sizes: { ...DEFAULT_SIZES }, smooth: 0,
    },
  };
}

export function newStroke(project, kind, w, brush) {
  // kind: 'ink' (pincel) | 'cut' (borracha) | 'fill' (balde: só o ponto tocado, a área é feita na máscara)
  // b: pincel do traço de tinta ('pencil' | 'marker' | 'chalk'); sem b = Pincel comum.
  const s = { id: project.nextId++, kind, w, pts: [] }; // pts = [x, y, pressão, x, y, pressão, …]
  if (kind === 'ink' && brush && brush !== 'brush') s.b = brush;
  return s;
}

export function cloneStroke(s, newId) {
  const c = { id: newId ?? s.id, kind: s.kind, w: s.w, pts: s.pts.slice() };
  if (s.b) c.b = s.b;
  return c;
}

// Balde: as paredes do preenchimento são as linhas da própria tinta e as das outras tintas que aparecem junto
// com esse frame (no meio do tempo dele, primeira volta do loop). Assim dá para fazer a linha numa tinta e o
// preenchimento em outra, como na gráfica. Devolve [{ l, f }] das outras tintas.
export function wallsFor(project, l, f) {
  const L = project.layers[l];
  const t = (f + 0.5) / L.fps;
  const out = [];
  project.layers.forEach((M, m) => {
    if (m === l) return;
    const n = M.frames.length;
    out.push({ l: m, f: ((Math.floor(t * M.fps + 1e-6) % n) + n) % n });
  });
  return out;
}

// Frames (de outras tintas) que têm balde e usam (l, f) como parede: precisam ser refeitos quando (l, f) muda.
export function fillDependents(project, l, f) {
  const out = [];
  project.layers.forEach((M, m) => {
    if (m === l) return;
    M.frames.forEach((fr, g) => {
      if (fr.some((s) => s.kind === 'fill') && wallsFor(project, m, g).some((w) => w.l === l && w.f === f)) out.push({ l: m, f: g });
    });
  });
  return out;
}

// Caixa do traço em unidades do documento.
export function strokeBounds(s) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i < s.pts.length; i += 3) {
    const x = s.pts[i], y = s.pts[i + 1];
    if (x < x0) x0 = x; if (y < y0) y0 = y;
    if (x > x1) x1 = x; if (y > y1) y1 = y;
  }
  const r = s.w / 2;
  return { x0: x0 - r, y0: y0 - r, x1: x1 + r, y1: y1 + r };
}

export function boundsOf(strokes) {
  let b = null;
  for (const s of strokes) {
    const c = strokeBounds(s);
    if (!b) b = { ...c };
    else { b.x0 = Math.min(b.x0, c.x0); b.y0 = Math.min(b.y0, c.y0); b.x1 = Math.max(b.x1, c.x1); b.y1 = Math.max(b.y1, c.y1); }
  }
  return b;
}

// Garante que um projeto carregado (do navegador ou de um arquivo .grao) tem todos os campos e só valores
// válidos. Traço estragado é descartado; o resto do projeto é aproveitado. Nunca lança erro.
export function sanitize(p) {
  const base = newProject();
  if (!p || typeof p !== 'object' || p.format !== 'grao-projeto' || !Array.isArray(p.layers)) return base;
  const num = (v, a, b, d) => (Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d);
  const out = {
    format: 'grao-projeto',
    version: 1,
    created: typeof p.created === 'string' ? p.created : base.created,
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 60) : base.name,
    paper: PAPERS[p.paper] ? p.paper : 'natural',
    nextId: 1,
    activeLayer: 0,
    layers: [],
    settings: { ...base.settings },
  };
  let maxId = 0;
  for (let l = 0; l < LAYERS; l++) {
    const src = p.layers[l];
    const def = base.layers[l];
    if (!src || typeof src !== 'object' || !Array.isArray(src.frames) || !src.frames.length) { out.layers.push(def); continue; }
    const frames = src.frames.slice(0, MAX_FRAMES).map((fr) => (Array.isArray(fr) ? fr : []).map(cleanStroke).filter(Boolean));
    for (const fr of frames) for (const s of fr) maxId = Math.max(maxId, s.id);
    out.layers.push({
      ink: Number.isInteger(src.ink) && src.ink >= 0 && src.ink < INKS.length ? src.ink : def.ink,
      fps: FPS_OPTIONS.includes(src.fps) ? src.fps : def.fps,
      frames,
    });
  }
  out.nextId = Math.max(Number.isInteger(p.nextId) ? p.nextId : 1, maxId + 1);
  out.activeLayer = Number.isInteger(p.activeLayer) && p.activeLayer >= 0 && p.activeLayer < LAYERS ? p.activeLayer : 0;
  const s = p.settings && typeof p.settings === 'object' ? p.settings : {};
  const set = out.settings;
  set.grain = num(s.grain, 0, 1, set.grain);
  set.mis = num(s.mis, 0, 1, set.mis);
  const hasSizes = s.sizes && typeof s.sizes === 'object';
  const sz = hasSizes ? s.sizes : {};
  set.sizes = { ...DEFAULT_SIZES };
  // projetos até a 0.3.0 tinham um tamanho só (settings.brush): vale para o Pincel e a Borracha
  if (!hasSizes && Number.isFinite(s.brush)) set.sizes.brush = set.sizes.eraser = s.brush;
  for (const k of Object.keys(DEFAULT_SIZES)) {
    set.sizes[k] = Math.round(num(sz[k], SIZE_MIN, SIZE_MAX, num(set.sizes[k], SIZE_MIN, SIZE_MAX, DEFAULT_SIZES[k])));
  }
  set.smooth = num(s.smooth, 0, 1, 0);
  for (const k of ['ferver', 'auto', 'lefty', 'pinWheel']) if (typeof s[k] === 'boolean') set[k] = s[k];
  set.wheelCorner = ['bl', 'br', 'tl', 'tr'].includes(s.wheelCorner) ? s.wheelCorner : null;
  return out;
}

function cleanStroke(s) {
  if (!s || typeof s !== 'object' || !Number.isInteger(s.id) || s.id < 1) return null;
  if (s.kind !== 'ink' && s.kind !== 'cut' && s.kind !== 'fill') return null;
  if (!Number.isFinite(s.w) || s.w <= 0) return null;
  const pts = s.pts;
  if (!Array.isArray(pts) || pts.length < 3 || pts.length % 3 !== 0 || pts.length > 300000) return null;
  for (const v of pts) if (!Number.isFinite(v)) return null;
  const out = { id: s.id, kind: s.kind, w: Math.min(200, s.w), pts: pts.slice() };
  if (s.kind === 'ink' && INK_BRUSHES.includes(s.b)) out.b = s.b;
  return out;
}
