// Desenho de um traço com espessura pela pressão, por pincel (T-021).
// Usado no traço molhado (tela) e na máscara (GPU), para os dois ficarem iguais.
// Sem suavização de propósito: suavizar atrasa o traço (a suavização opcional fica no input.js).
//
// Pincéis (stroke.b; sem b = 'brush'):
//   brush  Pincel    pressão vai de 15% a 100% da largura
//   pencil Lápis     metade da largura, tom de 62% na máscara: o grão do riso "quebra" o traço, como grafite
//   marker Marcador  largura fixa (chapado), ignora a pressão
//   chalk  Giz       carimbos falhados ao longo do traço (sempre iguais para o mesmo traço)
// A borracha (kind 'cut') usa sempre o formato do Pincel.

export const BRUSHES = {
  brush: { name: 'Pincel', min: 0.15, thin: 1, tone: 1 },
  pencil: { name: 'Lápis', min: 0.3, thin: 0.5, tone: 0.62 },
  marker: { name: 'Marcador', min: 1, thin: 1, tone: 1 },
  chalk: { name: 'Giz', min: 0.5, thin: 1, tone: 1, stamp: true },
};

const shapeOf = (s) => (s.kind === 'ink' && BRUSHES[s.b]) || BRUSHES.brush;

export function widthAt(w, pressure, shape = BRUSHES.brush) {
  return w * shape.thin * (shape.min + (1 - shape.min) * pressure);
}

// Cor de desenho: na máscara, o tom do pincel vira cinza (0..255); na tela, a cor da tinta com transparência.
function paint(ctx, s, color, mask) {
  const sh = shapeOf(s);
  if (mask) {
    const v = s.kind === 'cut' ? 0 : Math.round(255 * sh.tone);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = ctx.fillStyle = `rgb(${v},${v},${v})`;
  } else {
    ctx.globalAlpha = s.kind === 'cut' ? 1 : 0.35 + 0.65 * sh.tone;
    ctx.strokeStyle = ctx.fillStyle = color;
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return sh;
}

// Desenha o traço inteiro. scale converte unidades do documento para pixels do contexto.
// mask = true: desenhando a máscara (branco/cinza = tinta; o color é ignorado).
export function drawStroke(ctx, s, scale, color, mask = false) {
  const p = s.pts;
  if (p.length < 3 || s.kind === 'fill') return;   // balde é feito na máscara (render/fill.js)
  const sh = paint(ctx, s, color, mask);
  if (p.length === 3) {
    if (sh.stamp) stamps(ctx, s, 0, scale, sh);
    else dot(ctx, p[0] * scale, p[1] * scale, (widthAt(s.w, p[2], sh) * scale) / 2);
  } else {
    if (sh.stamp) stamps(ctx, s, 0, scale, sh);   // o 1º carimbo, como no traço molhado
    for (let i = 3; i < p.length; i += 3) {
      if (sh.stamp) stamps(ctx, s, i, scale, sh);
      else segment(ctx, p, i, s.w, scale, sh);
    }
  }
  ctx.globalAlpha = 1;
}

// Desenha só o último segmento (traço molhado, ponto a ponto).
export function drawLastSegment(ctx, s, color) {
  const p = s.pts;
  const sh = paint(ctx, s, color, false);
  const i = p.length - 3;
  if (sh.stamp) stamps(ctx, s, i, 1, sh);
  else if (p.length === 3) dot(ctx, p[0], p[1], widthAt(s.w, p[2], sh) / 2);
  else segment(ctx, p, i, s.w, 1, sh);
  ctx.globalAlpha = 1;
}

function segment(ctx, p, i, w, scale, sh) {
  ctx.lineWidth = Math.max(0.5, widthAt(w, (p[i - 1] + p[i + 2]) / 2, sh) * scale);
  ctx.beginPath();
  ctx.moveTo(p[i - 3] * scale, p[i - 2] * scale);
  ctx.lineTo(p[i] * scale, p[i + 1] * scale);
  ctx.stroke();
}

function dot(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fill();
}

// Número pseudoaleatório fixo para (traço, segmento, passo, carimbo): o giz sai igual na tela e na máscara.
function rnd(a, b, c, d) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647 + d * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// Giz: no segmento que termina no ponto i, carimbos pequenos espalhados dentro da largura, com falhas.
function stamps(ctx, s, i, scale, sh) {
  const p = s.pts;
  const x1 = p[i], y1 = p[i + 1];
  const x0 = i ? p[i - 3] : x1, y0 = i ? p[i - 2] : y1;
  const pr = i ? (p[i - 1] + p[i + 2]) / 2 : p[i + 2];
  const r = widthAt(s.w, pr, sh) / 2;
  const len = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(len / Math.max(0.6, r * 0.45)));
  for (let j = i ? 1 : 0; j <= steps; j++) {
    const t = j / steps;
    const cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
    for (let k = 0; k < 3; k++) {
      if (rnd(s.id, i, j, k + 7) < 0.28) continue;          // falha: o giz não pegou aqui
      const a = rnd(s.id, i, j, k) * Math.PI * 2;
      const d = Math.sqrt(rnd(s.id, i, j, k + 3)) * r * 0.8;
      dot(ctx, (cx + Math.cos(a) * d) * scale, (cy + Math.sin(a) * d) * scale, r * (0.25 + 0.3 * rnd(s.id, i, j, k + 5)) * scale);
    }
  }
}
