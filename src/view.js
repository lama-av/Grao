// Vista do papel (zoom e posição), T-020. Só da sessão: não vai para o arquivo.
// Tudo em "uv" do palco (0..1 na largura e na altura), para valer em qualquer resolução e no shader:
//   uv_tela = uv_documento * s + o        uv_documento = (uv_tela - o) / s
// s vai de 1 (papel inteiro na tela) a MAX_ZOOM. A posição é presa para o papel sempre cobrir a tela.

import { DOC_W, DOC_H } from './config.js';

export const MAX_ZOOM = 4;
const SNAP = 0.08;          // soltou a pinça perto de 100%: encaixa o papel inteiro

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function createView() { return { s: 1, ox: 0, oy: 0 }; }

export function fitView(v) { v.s = 1; v.ox = 0; v.oy = 0; return v; }

export const isFit = (v) => v.s === 1 && v.ox === 0 && v.oy === 0;

export function clampView(v) {
  v.s = clamp(v.s, 1, MAX_ZOOM);
  v.ox = clamp(v.ox, 1 - v.s, 0);
  v.oy = clamp(v.oy, 1 - v.s, 0);
  return v;
}

// Documento (unidades 1200×800) → uv da tela, e volta.
export function docToUv(v, x, y) { return { u: (x / DOC_W) * v.s + v.ox, w: (y / DOC_H) * v.s + v.oy }; }
export function uvToDoc(v, u, w) { return { x: ((u - v.ox) / v.s) * DOC_W, y: ((w - v.oy) / v.s) * DOC_H }; }

// Pinça de 2 dedos: start = { view (cópia), mid: {u, w}, dist } no começo; now = { mid, dist } agora.
// O ponto do papel que estava sob o meio dos dedos continua sob o meio dos dedos.
export function pinch(v, start, now) {
  const s = clamp(start.view.s * (now.dist / Math.max(1e-6, start.dist)), 1, MAX_ZOOM);
  const d = uvToDoc(start.view, start.mid.u, start.mid.w);
  v.s = s;
  v.ox = now.mid.u - (d.x / DOC_W) * s;
  v.oy = now.mid.w - (d.y / DOC_H) * s;
  return clampView(v);
}

// Fim da pinça: perto de 100% encaixa o papel inteiro.
export function settle(v) {
  if (v.s < 1 + SNAP) fitView(v);
  return v;
}
