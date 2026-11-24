// Documento: projeto, tintas (tambores), camadas, frames e traços.
// Só traços são salvos; máscaras são cache (ver docs/04-design-sistema-v0.1.md).
//
// Desde a v0.4 (ADR-004): o projeto tem 4 TINTAS (`inks`, os tambores da riso, cada uma com uma das 9 cores de
// INKS) e de 1 a 8 CAMADAS. Cada camada imprime com um tambor (`layer.ink` = 0..3), tem o próprio loop (fps,
// frames), visível, travada e retícula (`screen`). `layer.id` é fixo: as máscaras são guardadas por ele.
// Projetos da versão 1 (camada = tinta) abrem com 4 camadas, cada uma no seu tambor, sem mudança visual.

import { DEFAULT_FRAMES, DEFAULT_INKS, INKS, PAPERS, FPS_OPTIONS, MAX_FRAMES, LPI_OPTIONS } from '../config.js';

export const DRUMS = 4;                   // a riso imprime com 4 tambores por projeto
export const MAX_LAYERS = 8;
export const SCREEN_TYPES = ['stochastic', 'am'];   // retícula estocástica (padrão) ou reticulada
export const DOT_SHAPES = ['round', 'line', 'ellipse'];   // forma do ponto da reticulada (v0.7, #050)
export const DENSITY_MIN = 0.05;
const defaultScreen = () => ({ type: 'stochastic', density: 1, dot: 'round' });

// Camada nova no tambor `ink`.
export function newLayer(project, ink = 0, fps = 8, nframes = DEFAULT_FRAMES) {
  return {
    id: project.nextLayerId++,
    ink, fps,
    frames: Array.from({ length: nframes }, () => []),
    visible: true, locked: false, screen: defaultScreen(),
  };
}

// ---------- tempo da camada (exposição, v0.5 #038) ----------
// layer.expo (opcional): quantos tempos cada frame fica na tela (1 a 4). Sem expo = todos 1.
// "Tempo" = 1 / fps. O loop da camada tem layerTicks(layer) tempos.
export const MAX_EXPO = 4;
export const expoOf = (layer, f) => (layer.expo && layer.expo[f]) || 1;
export function layerTicks(layer) {
  let n = 0;
  for (let f = 0; f < layer.frames.length; f++) n += expoOf(layer, f);
  return n;
}
export function frameStartTick(layer, f) {
  let n = 0;
  for (let i = 0; i < f; i++) n += expoOf(layer, i);
  return n;
}
// Qual frame aparece no tempo (inteiro) `tick` (com volta do loop).
export function frameAtTick(layer, tick) {
  const total = layerTicks(layer);
  let k = ((tick % total) + total) % total;
  for (let f = 0; f < layer.frames.length; f++) {
    k -= expoOf(layer, f);
    if (k < 0) return f;
  }
  return layer.frames.length - 1;
}

// Identidade do projeto na galeria (v0.6): não muda ao renomear; arquivo aberto ganha uma nova (é uma cópia).
export function newUid() {
  const r = Math.random().toString(36).slice(2, 8);
  return `${Date.now().toString(36)}-${r}`;
}
const validUid = (u) => typeof u === 'string' && /^[a-z0-9-]{4,40}$/.test(u);

// Ordem de impressão dos tambores (v0.7, #048): na ordem das camadas, de baixo para cima (a primeira camada de
// cada tambor decide); tambores sem camada vão no fim. Devolve 4 índices de tambor.
export function printOrder(project) {
  const order = [];
  for (const L of project.layers) if (!order.includes(L.ink)) order.push(L.ink);
  for (let d = 0; d < DRUMS; d++) if (!order.includes(d)) order.push(d);
  return order;
}

// Cor (entrada de INKS) com que a camada imprime.
export const inkOf = (project, layer) => INKS[project.inks[layer.ink]] || INKS[0];

// Ferramentas com tamanho próprio (unidades do documento) e o intervalo do arco de Tamanho.
export const DEFAULT_SIZES = { brush: 10, pencil: 6, marker: 16, chalk: 14, eraser: 20 };
export const SIZE_MIN = 2, SIZE_MAX = 200;   // até 200 (pedido do Raphael, 24/11); o arco é mais fino nos pequenos
const INK_BRUSHES = ['pencil', 'marker', 'chalk'];

export function newProject(paper = 'natural') {
  const p = {
    format: 'grao-projeto',
    version: 2,
    created: new Date().toISOString(),
    uid: newUid(),
    name: 'Sem título',
    paper,
    nextId: 1,
    nextLayerId: 1,
    activeLayer: 0,
    inks: DEFAULT_INKS.slice(),
    layers: [],
    // wheelCorner: null = automático (inferior esquerdo; inferior direito no modo Canhoto)
    // sizes: tamanho de cada ferramenta (T-021). smooth: suavização do traço, 0 = desligada (decisão 6, T-025).
    settings: {
      grain: 0.6, mis: 0.5, ferver: true, auto: true, lefty: false, wheelCorner: null, pinWheel: false,
      sizes: { ...DEFAULT_SIZES }, smooth: 0,
      lpi: 60, trapping: true,            // lineatura da retícula reticulada (#030) e trapping do balde (#033)
      autoDir: 'forward', autoStop: false, // Auto: avança ou volta; para no último frame (#041)
      onion: { before: 1, after: 1, strength: 0.4 },   // papel-cebola: frames antes/depois (0–2), intensidade (#040)
      flaws: { rollers: false, transfer: false },        // imperfeições opcionais: marcas de rolo, transferência (#053)
      autoQuality: true,                                  // qualidade automática do compositor (#060)
      fingerDraw: false,                                  // desenhar com o dedo (sem caneta), opção do Menu
    },
  };
  for (let d = 0; d < DRUMS; d++) p.layers.push(newLayer(p, d));
  return p;
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
  const t = (frameStartTick(L, f) + expoOf(L, f) / 2) / L.fps;    // meio do tempo do frame (com exposição)
  const out = [];
  project.layers.forEach((M, m) => {
    if (m === l) return;
    out.push({ l: m, f: frameAtTick(M, Math.floor(t * M.fps + 1e-6)) });
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
// Versão 1 (até a 0.3.x): 4 camadas, e layer.ink era a cor (índice de INKS). Vira: inks = essas cores, layer.ink = 0..3.
export function sanitize(p) {
  const base = newProject();
  if (!p || typeof p !== 'object' || p.format !== 'grao-projeto' || !Array.isArray(p.layers)) return base;
  const num = (v, a, b, d) => (Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d);
  const v1 = !Array.isArray(p.inks);
  const out = {
    format: 'grao-projeto',
    version: 2,
    created: typeof p.created === 'string' ? p.created : base.created,
    uid: validUid(p.uid) ? p.uid : base.uid,
    name: typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 60) : base.name,
    paper: PAPERS[p.paper] ? p.paper : 'natural',
    nextId: 1,
    nextLayerId: 1,
    activeLayer: 0,
    inks: DEFAULT_INKS.slice(),
    layers: [],
    settings: { ...base.settings },
  };
  const validInk = (i) => Number.isInteger(i) && i >= 0 && i < INKS.length;
  if (!v1) for (let d = 0; d < DRUMS; d++) if (validInk(p.inks[d])) out.inks[d] = p.inks[d];

  let maxId = 0;
  const count = v1 ? DRUMS : Math.min(MAX_LAYERS, p.layers.length);
  const usedIds = new Set();
  for (let l = 0; l < count; l++) {
    const src = p.layers[l];
    const ok = src && typeof src === 'object' && Array.isArray(src.frames) && src.frames.length;
    if (v1 && validInk(src?.ink)) out.inks[l] = src.ink;           // versão 1: a cor da camada vira a do tambor
    const drum = v1 ? l : (Number.isInteger(src?.ink) && src.ink >= 0 && src.ink < DRUMS ? src.ink : l % DRUMS);
    const layer = newLayer(out, drum);
    if (ok) {
      layer.frames = src.frames.slice(0, MAX_FRAMES).map((fr) => (Array.isArray(fr) ? fr : []).map(cleanStroke).filter(Boolean));
      for (const fr of layer.frames) for (const st of fr) maxId = Math.max(maxId, st.id);
      if (FPS_OPTIONS.includes(src.fps)) layer.fps = src.fps;
      if (Array.isArray(src.expo)) {
        const ex = layer.frames.map((_, f) => (Number.isInteger(src.expo[f]) ? Math.min(MAX_EXPO, Math.max(1, src.expo[f])) : 1));
        if (ex.some((x) => x > 1)) layer.expo = ex;
      }
    }
    if (!v1 && src && typeof src === 'object') {
      if (Number.isInteger(src.id) && src.id > 0 && !usedIds.has(src.id)) layer.id = src.id;
      if (typeof src.visible === 'boolean') layer.visible = src.visible;
      if (typeof src.locked === 'boolean') layer.locked = src.locked;
      if (typeof src.name === 'string' && src.name.trim()) layer.name = src.name.trim().slice(0, 30);
      const sc = src.screen;
      if (sc && typeof sc === 'object') {
        layer.screen = {
          type: SCREEN_TYPES.includes(sc.type) ? sc.type : 'stochastic',
          density: num(sc.density, DENSITY_MIN, 1, 1),
          dot: DOT_SHAPES.includes(sc.dot) ? sc.dot : 'round',
        };
      }
    }
    usedIds.add(layer.id);
    out.layers.push(layer);
  }
  if (!out.layers.length) out.layers.push(newLayer(out, 0));
  if (p.welcome === true) out.welcome = true;   // projeto de boas-vindas (mostra as dicas da primeira vez)
  // ids únicos (um id automático pode ter repetido um id escrito no arquivo)
  let topId = Math.max(0, ...out.layers.map((L) => L.id));
  const seen = new Set();
  for (const L of out.layers) { if (seen.has(L.id)) L.id = ++topId; seen.add(L.id); }
  out.nextLayerId = Math.max(out.nextLayerId, ...out.layers.map((L) => L.id + 1),
    Number.isInteger(p.nextLayerId) ? p.nextLayerId : 1);
  out.nextId = Math.max(Number.isInteger(p.nextId) ? p.nextId : 1, maxId + 1);
  out.activeLayer = Number.isInteger(p.activeLayer) && p.activeLayer >= 0 && p.activeLayer < out.layers.length ? p.activeLayer : 0;
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
  for (const k of ['ferver', 'auto', 'lefty', 'pinWheel', 'trapping', 'autoQuality', 'fingerDraw']) if (typeof s[k] === 'boolean') set[k] = s[k];
  set.wheelCorner = ['bl', 'br', 'tl', 'tr'].includes(s.wheelCorner) ? s.wheelCorner : null;
  set.lpi = LPI_OPTIONS.includes(s.lpi) ? s.lpi : 60;
  set.autoDir = s.autoDir === 'back' ? 'back' : 'forward';
  const fl = s.flaws && typeof s.flaws === 'object' ? s.flaws : {};
  set.flaws = { rollers: fl.rollers === true, transfer: fl.transfer === true };
  if (typeof s.autoStop === 'boolean') set.autoStop = s.autoStop;
  const on = s.onion && typeof s.onion === 'object' ? s.onion : {};
  set.onion = {
    before: Number.isInteger(on.before) ? Math.min(2, Math.max(0, on.before)) : 1,
    after: Number.isInteger(on.after) ? Math.min(2, Math.max(0, on.after)) : 1,
    strength: num(on.strength, 0.1, 0.8, 0.4),
  };
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
