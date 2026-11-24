// Compositor riso em WebGL2. Carrega os shaders .vert/.frag (portáveis para OpenGL ES 3).

import { DOC_W, DOC_H } from '../../config.js';

export async function createRiso(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
  if (!gl) throw new Error('Este navegador não desenha com a GPU. Use o Chrome atualizado.');

  const [vs, fs] = await Promise.all([
    fetch(new URL('./riso.vert', import.meta.url)).then((r) => r.text()),
    fetch(new URL('./riso.frag', import.meta.url)).then((r) => r.text()),
  ]);
  const program = link(gl, vs, fs);
  const vao = gl.createVertexArray();

  const U = {};
  const names = ['uRes', 'uDoc', 'uMask0', 'uMask1', 'uMask2', 'uMask3', 'uPrev', 'uNext', 'uInk', 'uOpac',
    'uOff', 'uPaper', 'uFiber', 'uIncl', 'uTex', 'uGrain', 'uSeed', 'uOnion', 'uView'];
  for (const n of names) U[n] = gl.getUniformLocation(program, n) ?? gl.getUniformLocation(program, n + '[0]');

  gl.useProgram(program);
  ['uMask0', 'uMask1', 'uMask2', 'uMask3', 'uPrev', 'uNext'].forEach((n, i) => gl.uniform1i(U[n], i));

  let lastMs = 0;

  // s = { masks: [t0..t3], prev, next, inks: [[r,g,b]x4], opac: [4], offsets: [8 floats],
  //       paper: {rgb, fiber, incl, tex}, grain, seed, onion, view: {s, ox, oy} }
  function draw(s) {
    const t0 = performance.now();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    const tex = [...s.masks, s.prev, s.next];
    tex.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uDoc, DOC_W, DOC_H);
    gl.uniform3fv(U.uInk, s.inks.flat());
    gl.uniform1fv(U.uOpac, s.opac);
    gl.uniform2fv(U.uOff, s.offsets);
    gl.uniform3fv(U.uPaper, s.paper.rgb);
    gl.uniform1f(U.uFiber, s.paper.fiber);
    gl.uniform1f(U.uIncl, s.paper.incl);
    gl.uniform1f(U.uTex, s.paper.tex);
    gl.uniform1f(U.uGrain, s.grain);
    gl.uniform1f(U.uSeed, s.seed % 1000);
    gl.uniform1f(U.uOnion, s.onion ? 1 : 0);
    const v = s.view || { s: 1, ox: 0, oy: 0 };
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
