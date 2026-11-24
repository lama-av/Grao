// Máscaras: uma textura de 1 canal (R8) por frame de cada tinta.
// Branco = tinta, preto = sem tinta. Recorte desenha preto por cima.
// Um único canvas de rascunho é reaproveitado para rasterizar (não guardamos canvas por frame).

import { DOC_W, DOC_H, MASK_SCALE } from '../config.js';
import { drawStroke } from './stroke.js';
import { floodFill } from './fill.js';

export class Masks {
  constructor(gl) {
    this.gl = gl;
    this.w = Math.round(DOC_W * MASK_SCALE);
    this.h = Math.round(DOC_H * MASK_SCALE);
    this.textures = new Map();
    this.scratch = document.createElement('canvas');
    this.scratch.width = this.w;
    this.scratch.height = this.h;
    this.ctx = this.scratch.getContext('2d', { willReadFrequently: true });   // o balde lê os pixels
    this.empty = this.#createTexture();
    // O rascunho guarda o último frame desenhado. Se o mesmo frame volta só com traços novos no fim (o caso
    // comum: acabou de desenhar), desenhamos só os novos, sem refazer os baldes de antes.
    this.lastKey = -1;
    this.lastStrokes = [];
  }

  key(l, f) { return l * 100 + f; }

  get(l, f) { return this.textures.get(this.key(l, f)) || this.empty; }

  rebuild(l, f, strokes) {
    const gl = this.gl;
    const k = this.key(l, f);
    if (!strokes || strokes.length === 0) {
      const t = this.textures.get(k);
      if (t) { gl.deleteTexture(t); this.textures.delete(k); }
      if (k === this.lastKey) this.lastKey = -1;
      return;
    }
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'source-over';
    // Traços confirmados são imutáveis (CLAUDE.md): mesmo objeto = mesmo desenho. Só vale quando há traço novo
    // no fim; mesma lista de novo significa que algo mudou no lugar (mover/girar a seleção mexe nos clones).
    const last = this.lastStrokes;
    let from = 0;
    if (k === this.lastKey && strokes.length > last.length && last.every((s, i) => s === strokes[i])) {
      from = last.length;
    } else {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.w, this.h);
    }
    this.lastKey = k;
    this.lastStrokes = strokes.slice();
    for (let i = from; i < strokes.length; i++) {
      const s = strokes[i];
      if (s.kind === 'fill') this.#fill(s);
      else drawStroke(ctx, s, MASK_SCALE, s.kind === 'cut' ? '#000' : '#fff');
    }

    let t = this.textures.get(k);
    if (!t) { t = this.#createTexture(); this.textures.set(k, t); }
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RED, gl.UNSIGNED_BYTE, this.scratch);
  }

  rebuildAll(project) {
    this.clear();
    project.layers.forEach((layer, l) => layer.frames.forEach((fr, f) => this.rebuild(l, f, fr)));
  }

  drop(l, f) { this.rebuild(l, f, null); }

  clear() {
    this.lastKey = -1;
    for (const t of this.textures.values()) this.gl.deleteTexture(t);
    this.textures.clear();
  }

  // Balde: preenche a área em volta do ponto com o que já foi desenhado até aqui (ordem dos traços).
  #fill(s) {
    const img = this.ctx.getImageData(0, 0, this.w, this.h);
    if (floodFill(img.data, this.w, this.h, s.pts[0] * MASK_SCALE, s.pts[1] * MASK_SCALE)) {
      this.ctx.putImageData(img, 0, 0);
    }
  }

  #createTexture() {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, this.w, this.h); // WebGL2 inicializa com zeros
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
}
