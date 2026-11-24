// Miniatura de um frame (tira de frames da folha Tempo, v0.5 #036). Feita na CPU, num canvas pequeno:
// traços em tons de cinza (como a máscara), baldes pelo mesmo preenchimento da máscara, e depois a cor da tinta
// multiplicada sobre a cor do papel. Sem grão nem retícula: é para reconhecer o desenho, não para imprimir.

import { DOC_W } from '../config.js';
import { drawStroke } from './stroke.js';
import { floodFill } from './fill.js';

export const THUMB_W = 96, THUMB_H = 64;

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

// Cobertura (0..255) de uma lista de traços num canvas pequeno.
function coverage(ctx, strokes, w, h) {
  const k = w / DOC_W;
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);
  for (const s of strokes) {
    if (s.kind === 'fill') {
      const img = ctx.getImageData(0, 0, w, h);
      if (floodFill(img.data, w, h, s.pts[0] * k, s.pts[1] * k, 1)) ctx.putImageData(img, 0, 0);
    } else {
      drawStroke(ctx, { ...s, w: Math.max(s.w, 6) }, k, null, true);   // traço fino demais some na miniatura
    }
  }
  return ctx.getImageData(0, 0, w, h).data;
}

export function drawThumb(canvas, strokes, inkHex, paperHex) {
  drawComposite(canvas, [{ strokes, inkHex }], paperHex, THUMB_W, THUMB_H);
}

// Várias camadas multiplicadas sobre o papel (miniatura do projeto na galeria).
export function drawComposite(canvas, layers, paperHex, w = THUMB_W, h = THUMB_H) {
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const scratch = document.createElement('canvas');
  scratch.width = w; scratch.height = h;
  const sctx = scratch.getContext('2d', { willReadFrequently: true });
  const out = new Float32Array(w * h * 3);
  const [pr, pg, pb] = rgb(paperHex);
  for (let i = 0; i < w * h; i++) { out[i * 3] = pr; out[i * 3 + 1] = pg; out[i * 3 + 2] = pb; }
  for (const L of layers) {
    if (!L.strokes.length) continue;
    const d = coverage(sctx, L.strokes, w, h);
    const [ir, ig, ib] = rgb(L.inkHex);
    for (let i = 0, j = 0; i < w * h; i++, j += 4) {
      const a = d[j] / 255;
      if (!a) continue;
      out[i * 3] *= 1 - a + (a * ir) / 255;
      out[i * 3 + 1] *= 1 - a + (a * ig) / 255;
      out[i * 3 + 2] *= 1 - a + (a * ib) / 255;
    }
  }
  const img = ctx.createImageData(w, h);
  for (let i = 0, j = 0; i < w * h; i++, j += 4) {
    img.data[j] = out[i * 3]; img.data[j + 1] = out[i * 3 + 1]; img.data[j + 2] = out[i * 3 + 2]; img.data[j + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
