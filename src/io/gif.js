// Codificador de GIF animado (v0.6, #044), escrito para o Grão (sem biblioteca).
// Cada frame tem a própria paleta de até 256 cores (tabela local): o riso tem poucas cores por frame (papel × tintas
// × grão), então uma paleta por frame fica fiel sem pontilhado. Formato: GIF89a, laço infinito (NETSCAPE2.0).
//
// Uso: const g = new GifWriter(w, h); g.addFrame(rgba, atrasoEmCentésimos); const bytes = g.finish();

// ---------- paleta ----------
// Conta as cores em 5 bits por canal (32.768 caixas), fica com as 256 mais frequentes (média de cada caixa) e
// mapeia cada pixel para a cor mais próxima (com cache por caixa).
export function quantize(rgba) {
  const n = rgba.length / 4;
  const count = new Uint32Array(32768), sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768);
  const box = new Uint16Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    const k = ((rgba[j] >> 3) << 10) | ((rgba[j + 1] >> 3) << 5) | (rgba[j + 2] >> 3);
    box[i] = k; count[k]++; sr[k] += rgba[j]; sg[k] += rgba[j + 1]; sb[k] += rgba[j + 2];
  }
  const used = [];
  for (let k = 0; k < 32768; k++) if (count[k]) used.push(k);
  used.sort((a, b) => count[b] - count[a]);
  const top = used.slice(0, 256);
  const palette = new Uint8Array(256 * 3);
  top.forEach((k, p) => {
    palette[p * 3] = Math.round(sr[k] / count[k]);
    palette[p * 3 + 1] = Math.round(sg[k] / count[k]);
    palette[p * 3 + 2] = Math.round(sb[k] / count[k]);
  });
  const map = new Int16Array(32768).fill(-1);
  top.forEach((k, p) => { map[k] = p; });
  const indices = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const k = box[i];
    let p = map[k];
    if (p < 0) {                          // cor rara: a mais próxima da paleta
      const r = sr[k] / count[k], g = sg[k] / count[k], b = sb[k] / count[k];
      let best = 0, bd = Infinity;
      for (let q = 0; q < top.length; q++) {
        const dr = palette[q * 3] - r, dg = palette[q * 3 + 1] - g, db = palette[q * 3 + 2] - b;
        const d = dr * dr + dg * dg + db * db;
        if (d < bd) { bd = d; best = q; }
      }
      p = map[k] = best;
    }
    indices[i] = p;
  }
  return { palette, indices, colors: Math.max(2, top.length) };
}

// ---------- LZW do GIF ----------
export function lzwEncode(indices, minCodeSize) {
  const out = [];
  let cur = 0, bits = 0;
  const clear = 1 << minCodeSize, eoi = clear + 1;
  let codeSize = minCodeSize + 1, next = eoi + 1;
  let dict = new Map();
  const emit = (code) => {
    cur |= code << bits; bits += codeSize;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
  };
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const c = indices[i];
    const key = prefix * 4096 + c;
    const hit = dict.get(key);
    if (hit !== undefined) { prefix = hit; continue; }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > (1 << codeSize) && codeSize < 12) codeSize++;
    } else {                              // dicionário cheio: recomeça
      emit(clear);
      dict = new Map(); codeSize = minCodeSize + 1; next = eoi + 1;
    }
    prefix = c;
  }
  emit(prefix);
  emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

// ---------- arquivo ----------
export class GifWriter {
  constructor(width, height) {
    this.w = width; this.h = height;
    this.parts = [];
    const b = [];
    for (const ch of 'GIF89a') b.push(ch.charCodeAt(0));
    b.push(width & 255, width >> 8, height & 255, height >> 8, 0x70, 0, 0);   // sem tabela global
    // NETSCAPE2.0: repetir para sempre
    b.push(0x21, 0xff, 11, ...[...'NETSCAPE2.0'].map((c) => c.charCodeAt(0)), 3, 1, 0, 0, 0);
    this.parts.push(new Uint8Array(b));
  }

  addFrame(rgba, delayCs) {
    const { palette, indices, colors } = quantize(rgba);
    let bitsPerColor = 1;
    while ((1 << bitsPerColor) < colors) bitsPerColor++;
    const b = [];
    b.push(0x21, 0xf9, 4, 0x00, delayCs & 255, (delayCs >> 8) & 255, 0, 0);     // controle: atraso
    b.push(0x2c, 0, 0, 0, 0, this.w & 255, this.w >> 8, this.h & 255, this.h >> 8, 0x80 | (bitsPerColor - 1));
    for (let i = 0; i < (1 << bitsPerColor); i++) b.push(palette[i * 3] || 0, palette[i * 3 + 1] || 0, palette[i * 3 + 2] || 0);
    const minCode = Math.max(2, bitsPerColor);
    b.push(minCode);
    const data = lzwEncode(indices, minCode);
    for (let i = 0; i < data.length; i += 255) {
      const chunk = data.slice(i, i + 255);
      b.push(chunk.length, ...chunk);
    }
    b.push(0);
    this.parts.push(new Uint8Array(b));
  }

  finish() {
    this.parts.push(new Uint8Array([0x3b]));
    const total = this.parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let o = 0;
    for (const p of this.parts) { out.set(p, o); o += p.length; }
    return out;
  }
}
