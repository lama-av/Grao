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

  const SAMPLERS = ['uMask0', 'uMask1', 'uMask2', 'uMask3', 'uMask4', 'uMask5', 'uMask6', 'uMask7', 'uPrev', 'uNext',
    'uPrev2', 'uNext2'];
  const U = {};
  const names = [...SAMPLERS, 'uRes', 'uDoc', 'uLayerOn', 'uLayerInk', 'uLayerType', 'uLayerDens', 'uInk', 'uOff',
    'uAngle', 'uCell', 'uPxDoc', 'uPaper', 'uFiber', 'uIncl', 'uTex', 'uGrain', 'uSeed', 'uOnion', 'uView', 'uOnionW',
    'uLayerDot', 'uOrder', 'uOpaque', 'uSep', 'uFlaw'];
  for (const n of names) U[n] = gl.getUniformLocation(program, n) ?? gl.getUniformLocation(program, n + '[0]');

  gl.useProgram(program);
  SAMPLERS.forEach((n, i) => gl.uniform1i(U[n], i));

  let lastMs = 0;

  // s = {
  //   layers: [{ mask, ink (0..3), type (0 estocástica | 1 reticulada), density, dot (0..2), on }] (até 8),
  //   order: [4 tambores na ordem de impressão], opaque: [4], sep: -1 | 0..3, flaws: [rolo, transferência],
  //   prev, next, prev2, next2, onionW [4], empty (textura vazia), inks: [[r,g,b] x4], offsets: [8 floats], angles: [4 rad],
  //   cell (unidades do documento), paper: {rgb, fiber, incl, tex}, grain, seed, onion, view: {s, ox, oy}
  // }
  // target (opcional): { fbo, w, h } de createTarget — desenha fora da tela (exportação, sem piscar o papel).
  function draw(s, target = null) {
    const t0 = performance.now();
    const W = target ? target.w : canvas.width, H = target ? target.h : canvas.height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    const on = new Float32Array(MAX_DRAW_LAYERS), ink = new Float32Array(MAX_DRAW_LAYERS);
    const type = new Float32Array(MAX_DRAW_LAYERS), dens = new Float32Array(MAX_DRAW_LAYERS).fill(1);
    const dot = new Float32Array(MAX_DRAW_LAYERS);
    for (let i = 0; i < MAX_DRAW_LAYERS; i++) {
      const L = s.layers[i];
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, L ? L.mask : s.empty);
      if (L) { on[i] = L.on ? 1 : 0; ink[i] = L.ink; type[i] = L.type; dens[i] = L.density; dot[i] = L.dot || 0; }
    }
    gl.activeTexture(gl.TEXTURE8); gl.bindTexture(gl.TEXTURE_2D, s.prev);
    gl.activeTexture(gl.TEXTURE9); gl.bindTexture(gl.TEXTURE_2D, s.next);
    gl.activeTexture(gl.TEXTURE10); gl.bindTexture(gl.TEXTURE_2D, s.prev2 || s.empty);
    gl.activeTexture(gl.TEXTURE11); gl.bindTexture(gl.TEXTURE_2D, s.next2 || s.empty);
    gl.uniform4fv(U.uOnionW, s.onionW || [0.4, 0, 0.4, 0]);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform2f(U.uDoc, DOC_W, DOC_H);
    gl.uniform1fv(U.uLayerOn, on);
    gl.uniform1fv(U.uLayerInk, ink);
    gl.uniform1fv(U.uLayerType, type);
    gl.uniform1fv(U.uLayerDens, dens);
    gl.uniform1fv(U.uLayerDot, dot);
    gl.uniform1fv(U.uOrder, s.order || [0, 1, 2, 3]);
    gl.uniform1fv(U.uOpaque, s.opaque || [0, 0, 0, 0]);
    gl.uniform1f(U.uSep, s.sep ?? -1);
    gl.uniform2fv(U.uFlaw, s.flaws || [0, 0]);
    gl.uniform3fv(U.uInk, s.inks.flat());
    gl.uniform2fv(U.uOff, s.offsets);
    gl.uniform1fv(U.uAngle, s.angles);
    gl.uniform1f(U.uCell, s.cell);
    const v = s.view || { s: 1, ox: 0, oy: 0 };
    gl.uniform1f(U.uPxDoc, DOC_W / (W * v.s));
    gl.uniform3fv(U.uPaper, s.paper.rgb);
    gl.uniform1f(U.uFiber, s.paper.fiber);
    gl.uniform1f(U.uIncl, s.paper.incl);
    gl.uniform1f(U.uTex, s.paper.tex);
    gl.uniform1f(U.uGrain, s.grain);
    gl.uniform1f(U.uSeed, s.seed % 1000);
    gl.uniform1f(U.uOnion, s.onion ? 1 : 0);
    gl.uniform3f(U.uView, v.s, v.ox, v.oy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (target) gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    else lastMs = performance.now() - t0;
  }

  // Alvo fora da tela, do tamanho da exportação.
  function createTarget(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fbo, tex, w, h };
  }
  // Lê os pixels do alvo, de cima para baixo (RGBA).
  function read(target) {
    const { w, h } = target;
    const px = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const out = new Uint8ClampedArray(w * h * 4), row = w * 4;
    for (let y = 0; y < h; y++) out.set(px.subarray((h - 1 - y) * row, (h - y) * row), y * row);
    return out;
  }
  function destroyTarget(target) { gl.deleteFramebuffer(target.fbo); gl.deleteTexture(target.tex); }

  return { gl, draw, createTarget, read, destroyTarget, get lastMs() { return lastMs; } };
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
