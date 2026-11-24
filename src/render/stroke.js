// Desenho de um traço com espessura pela pressão.
// Usado no traço molhado (tela) e na máscara (GPU), para os dois ficarem iguais.
// Sem suavização de propósito: suavizar atrasa o traço.

export function widthAt(w, pressure) {
  return w * (0.15 + 0.85 * pressure);
}

// Desenha o traço inteiro. scale converte unidades do documento para pixels do contexto.
export function drawStroke(ctx, s, scale, color) {
  const p = s.pts;
  if (p.length < 3) return;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (p.length === 3) {
    dot(ctx, p[0] * scale, p[1] * scale, (widthAt(s.w, p[2]) * scale) / 2);
    return;
  }
  for (let i = 3; i < p.length; i += 3) {
    segment(ctx, p, i, s.w, scale);
  }
}

// Desenha só o último segmento (traço molhado, ponto a ponto).
export function drawLastSegment(ctx, s, color) {
  const p = s.pts;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (p.length === 3) { dot(ctx, p[0], p[1], widthAt(s.w, p[2]) / 2); return; }
  segment(ctx, p, p.length - 3, s.w, 1);
}

function segment(ctx, p, i, w, scale) {
  ctx.lineWidth = Math.max(0.5, widthAt(w, (p[i - 1] + p[i + 2]) / 2) * scale);
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
