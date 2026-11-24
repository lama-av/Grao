// Compositor riso em WebGL2. Carrega os shaders .vert/.frag (portáveis para OpenGL ES 3).
// v0.4: até 8 camadas (uma textura cada) e 4 tintas; retícula por camada (ver riso.frag e docs/05-motor-riso.md).

import { DOC_W, DOC_H } from '../../config.js';

export const MAX_DRAW_LAYERS = 8;

export async function createRiso(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error('Este navegador não desenha com a GPU. Use o Chrome atualizado.');

  const [vs, fs] = await Promise.all([
    fetch(new URL('./riso.vert', import.meta.url)).then((r) => r.text()),
    fetch(new URL('./riso.frag', import.meta.url)).then((r) => r.text()),
  ]);
  const program = link(gl, vs, fs);
  const vao = gl.createVertexArray();

  const SAMPLERS = ['uMask0', 'uMask1', 'uMask2', 'uMask3', 'uMask4', 'uMask5', 'uMask6', 'uMask7', 'uPrev', 'uNext'];
  const U = {};
  const names = [...SAMPLERS, 'uRes', 'uDoc', 'uLayerOn', 'uLayerInk', 'uLayerType', 'uLayerDens', 'uInk', 'uOff',
    'uAngle', 'uCell', 'uPxDoc', 'uPaper', 'uFiber', 'uIncl', 'uTex', 'uGrain', 'uSeed', 'uOnion', 'uView'];
  for (const n of names) U[n] = gl.getUniformLocation(program, n) ?? gl.getUniformLocation(program, n + '[0]');

  gl.useProgram(program);
  SAMPLERS.forEach((n, i) => gl.uniform1i(U[n], i));

  let lastMs = 0;

  // s = {
  //   layers: [{ mask, ink (0..3), type (0 estocástica | 1 reticulada), density, on }] (até 8),
  //   prev, next, empty (textura vazia), inks: [[r,g,b] x4], offsets: [8 floats], angles: [4 rad],
  //   cell (unidades do documento), paper: {rgb, fiber, incl, tex}, grain, seed, onion, view: {s, ox, oy}
  // }
  function draw(s) {
    const t0 = performance.now();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    const on = new Float32Array(MAX_DRAW_LAYERS), ink = new Float32Array(MAX_DRAW_LAYERS);
    const type = new Float32Array(MAX_DRAW_LAYERS), dens = new Float32Array(MAX_DRAW_LAYERS).fill(1);
    for (let i = 0; i < MAX_DRAW_LAYERS; i++) {
      const L = s.layers[i];
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, L ? L.mask : s.empty);
      if (L) { on[i] = L.on ? 1 : 0; ink[i] = L.ink; type[i] = L.type; dens[i] = L.density; }
    }
    gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, s.prev);
    gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, s.next);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uDoc, DOC_W, DOC_H);
    gl.uniform1fv(U.uLayerOn, on);
    gl.uniform1fv(U.uLayerInk, ink);
    gl.uniform1fv(U.uLayerType, type);
    gl.uniform1fv(U.uLayerDens, dens);
    gl.uniform3fv(U.uInk, s.inks.flat());
    gl.uniform2fv(U.uOff, s.offsets);
    gl.uniform1fv(U.uAngle, s.angles);
    gl.uniform1f(U.uCell, s.cell);
    const v = s.view || { s: 1, ox: 0, oy: 0 };
    gl.uniform1f(U.uPxDoc, DOC_W / (canvas.width * v.s));
    gl.uniform3fv(U.uPaper, s.paper.rgb);
    gl.uniform1f(U.uFiber, s.paper.fiber);
    gl.uniform1f(U.uIncl, s.paper.incl);
    gl.uniform1f(U.uTex, s.paper.tex);
    gl.uniform1f(U.uGrain, s.grain);
    gl.uniform1f(U.uSeed, s.seed % 1000);
    gl.uniform1f(U.uOnion, s.onion ? 1 : 0);
    gl.uniform3f(U.uView, v.s, v.ox, v.oy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    lastMs = performance.now() - t0;
  }

  return { gl, draw, get lastMs() { return lastMs; } };
}

function link(gl, vsSrc, fsSrc) {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Shader: ' + gl.getProgramInfoLog(p));
  return p;
}

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader: ' + gl.getShaderInfoLog(s));
  return s;
}
