// Documento: projeto, tintas (camadas), frames e traços.
// Só traços são salvos; máscaras são cache (ver docs/04-design-sistema-v0.1.md).

import { DEFAULT_FRAMES, DEFAULT_INKS } from '../config.js';

export function newProject(paper = 'natural') {
  return {
    format: 'grao-projeto',
    version: 1,
    created: new Date().toISOString(),
    paper,
    nextId: 1,
    activeLayer: 0,
    layers: DEFAULT_INKS.map((ink) => ({
      ink,
      fps: 8,
      frames: Array.from({ length: DEFAULT_FRAMES }, () => []),
    })),
    // wheelCorner: null = automático (inferior esquerdo; inferior direito no modo Canhoto)
    settings: { grain: 0.6, mis: 0.5, ferver: true, auto: true, brush: 10, lefty: false, wheelCorner: null, pinWheel: false },
  };
}

export function newStroke(project, kind, w) {
  return { id: project.nextId++, kind, w, pts: [] }; // pts = [x, y, pressão, x, y, pressão, …]
}

export function cloneStroke(s, newId) {
  return { id: newId ?? s.id, kind: s.kind, w: s.w, pts: s.pts.slice() };
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

// Garante que um projeto carregado tem todos os campos (arquivos antigos ou editados à mão).
export function sanitize(p) {
  const base = newProject();
  if (!p || p.format !== 'grao-projeto' || !Array.isArray(p.layers)) return base;
  p.settings = { ...base.settings, ...(p.settings || {}) };
  if (!p.paper) p.paper = 'natural';
  if (typeof p.nextId !== 'number') p.nextId = 1;
  if (typeof p.activeLayer !== 'number') p.activeLayer = 0;
  return p;
}
