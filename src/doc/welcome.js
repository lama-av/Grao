// Projeto de boas-vindas (v0.8, #055): o Grão abre com um loop já tocando (Hadid: "abrir → loop rodando →
// desenhar") e 3 dicas no próprio papel, sem tutorial em tela cheia. Feito por código, não por arquivo.
//
// Uma bola quica em 8 frames: contorno na tinta Preto (camada 4), miolo na Rosa flúor (camada 1) por balde
// (mostra o balde com linha de outra tinta) e o chão em Azul (camada 2). Achata quando bate no chão.

import { newProject, newStroke } from './project.js';

function ring(project, cx, cy, rx, ry, w) {
  const s = newStroke(project, 'ink', w);
  const n = 56;
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    s.pts.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 0.75);
  }
  return s;
}

export function welcomeProject(paper = 'natural') {
  const p = newProject(paper);
  p.name = 'Boas-vindas';
  p.welcome = true;
  const ground = 640;
  const [pink, blue, , black] = p.layers;      // tambores 0..3: Rosa flúor, Azul, Amarelo, Preto
  for (let f = 0; f < 8; f++) {
    const h = Math.abs(Math.cos((f / 8) * Math.PI));         // 1 no alto, 0 no chão
    const squash = f === 4 ? 1.25 : f === 3 || f === 5 ? 1.08 : 1;
    const rx = 70 * squash, ry = 70 / squash;
    const cy = ground - ry - h * 330;
    const cx = 600;
    black.frames[f].push(ring(p, cx, cy, rx, ry, 9));
    const fill = newStroke(p, 'fill', 1);
    fill.pts.push(cx, cy, 1);
    pink.frames[f].push(fill);
    const line = newStroke(p, 'ink', 7);
    for (let x = 300; x <= 900; x += 20) line.pts.push(x, ground + 4, 0.7);
    blue.frames[f].push(line);
    const shadow = newStroke(p, 'ink', 10);
    const sw = 40 + (1 - h) * 50;
    for (let x = -sw; x <= sw; x += 6) shadow.pts.push(cx + x, ground + 22, 0.5);
    blue.frames[f].push(shadow);
  }
  return p;
}

// Dicas da primeira vez: some cada uma quando a pessoa faz o que ela diz.
export const HINTS = [
  { id: 'draw', text: 'Desenhe com a caneta. O dedo não risca.' },
  { id: 'wheel', text: 'Toque aqui: a roda tem tempo, tintas e ferramentas.' },
  { id: 'time', text: 'Arraste 2 dedos para os lados: o tempo anda.' },
];
