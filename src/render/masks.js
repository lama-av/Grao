// Máscaras: uma textura de 1 canal (R8) por frame de cada tinta.
// Branco = tinta, preto = sem tinta. Recorte desenha preto por cima.
// Um único canvas de rascunho é reaproveitado para rasterizar (não guardamos canvas por frame).

import { DOC_W, DOC_H, MASK_SCALE } from '../config.js';
import { drawStroke } from './stroke.js';

export class Masks {
  constructor(gl) {
    this.gl = gl;
    this.w = Math.round(DOC_W * MASK_SCALE);
    this.h = Math.round(DOC_H * MASK_SCALE);
    this.textures = new Map();
    this.scratch = document.createElement('canvas');
    this.scratch.width = this.w;
    this.scratch.height = this.h;
    this.ctx = this.scratch.getContext('2d');
    this.empty = this.#createTexture();
  }

  key(l, f) { return l * 100 + f; }

  get(l, f) { return this.textures.get(this.key(l, f)) || this.empty; }

  rebuild(l, f, strokes) {
    const gl = this.gl;
    const k = this.key(l, f);
    if (!strokes || strokes.length === 0) {
      const t = this.textures.get(k);
      if (t) { gl.deleteTexture(t); this.textures.delete(k); }
      return;
    }
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, this.w, this.h);
    for (const s of strokes) drawStroke(ctx, s, MASK_SCALE, s.kind === 'cut' ? '#000' : '#fff');

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
    for (const t of this.textures.values()) this.gl.deleteTexture(t);
    this.textures.clear();
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
