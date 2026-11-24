// Miniatura de um frame (tira de frames da folha Tempo, v0.5 #036). Feita na CPU, num canvas pequeno:
// traços em tons de cinza (como a máscara), baldes pelo mesmo preenchimento da máscara, e depois a cor da tinta
// multiplicada sobre a cor do papel. Sem grão nem retícula: é para reconhecer o desenho, não para imprimir.

import { DOC_W } from '../config.js';
import { drawStroke } from './stroke.js';
import { floodFill } from './fill.js';

export const THUMB_W = 96, THUMB_H = 64;

const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

export function drawThumb(canvas, strokes, inkHex, paperHex) {
  canvas.width = THUMB_W;
  canvas.height = THUMB_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const k = THUMB_W / DOC_W;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, THUMB_W, THUMB_H);
  for (const s of strokes) {
    if (s.kind === 'fill') {
      const img = ctx.getImageData(0, 0, THUMB_W, THUMB_H);
      if (floodFill(img.data, THUMB_W, THUMB_H, s.pts[0] * k, s.pts[1] * k, 1)) ctx.putImageData(img, 0, 0);
    } else {
      drawStroke(ctx, { ...s, w: Math.max(s.w, 6) }, k, null, true);   // traço fino demais some na miniatura
    }
  }
  const img = ctx.getImageData(0, 0, THUMB_W, THUMB_H);
  const d = img.data, [ir, ig, ib] = rgb(inkHex), [pr, pg, pb] = rgb(paperHex);
  for (let j = 0; j < d.length; j += 4) {
    const a = d[j] / 255;
    d[j] = pr * (1 - a + (a * ir) / 255);
    d[j + 1] = pg * (1 - a + (a * ig) / 255);
    d[j + 2] = pb * (1 - a + (a * ib) / 255);
    d[j + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
