// Balde: preenche a área fechada em volta de um ponto, dentro da máscara de uma tinta.
// O balde não guarda pixels: guarda só o ponto ({ kind: 'fill', pts: [x, y, 1] }). A área é recalculada
// sempre que a máscara é refeita, na ordem dos traços. Assim, mover ou duplicar as linhas leva o
// preenchimento junto (bom para animar), e o arquivo continua só com traços (decisão 4).
//
// Funções puras sobre Uint8ClampedArray RGBA (ImageData.data): testáveis sem navegador.

const INK = 128;      // canal R acima disso = tinta

// Engorda uma máscara binária por r pixels (quadrado), em duas passadas (horizontal e vertical).
function dilate(src, w, h, r) {
  if (r <= 0) return src;
  const tmp = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let last = -1e9;                       // última posição marcada à esquerda
    for (let x = 0; x < w; x++) { if (src[row + x]) last = x; if (x - last <= r) tmp[row + x] = 1; }
    last = 1e9;
    for (let x = w - 1; x >= 0; x--) { if (src[row + x]) last = x; if (last - x <= r) tmp[row + x] = 1; }
  }
  const out = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) {
    let last = -1e9;
    for (let y = 0; y < h; y++) { if (tmp[y * w + x]) last = y; if (y - last <= r) out[y * w + x] = 1; }
    last = 1e9;
    for (let y = h - 1; y >= 0; y--) { if (tmp[y * w + x]) last = y; if (last - y <= r) out[y * w + x] = 1; }
  }
  return out;
}

// Preenche a partir de (sx, sy), em pixels da máscara.
// gap: buracos de até ~2*gap px na linha são fechados (a tinta "não vaza" por falhas pequenas do traço).
// Devolve quantos pixels foram pintados (0 = tocou em cima de uma linha ou fora da máscara).
// extraWall (opcional): Uint8Array w*h com 1 onde há linha de outra camada (também segura o preenchimento).
// trap (px): trapping (#033). O preenchimento avança mais `trap` px por baixo das linhas que o seguraram, só por
// cima de pixels de linha, nunca para fora da área. Evita o filete de papel quando as tintas desalinham.
export function floodFill(rgba, w, h, sx, sy, gap = 2, extraWall = null, trap = 0) {
  sx = Math.floor(sx); sy = Math.floor(sy);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return 0;
  const ink = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < ink.length; i++, j += 4) ink[i] = rgba[j] >= INK || (extraWall && extraWall[i]) ? 1 : 0;
  const wall = dilate(ink, w, h, gap);
  if (wall[sy * w + sx]) return 0;

  // varredura por linhas (scanline): pilha de sementes, cada uma expande para os lados
  const region = new Uint8Array(w * h);
  const stack = [sx, sy];
  while (stack.length) {
    const y = stack.pop(), x0 = stack.pop();
    let x = x0;
    const row = y * w;
    if (region[row + x] || wall[row + x]) continue;
    while (x > 0 && !wall[row + x - 1] && !region[row + x - 1]) x--;
    let upOpen = false, downOpen = false;
    for (; x < w && !wall[row + x] && !region[row + x]; x++) {
      region[row + x] = 1;
      if (y > 0) {
        const free = !wall[row - w + x] && !region[row - w + x];
        if (free && !upOpen) { stack.push(x, y - 1); upOpen = true; } else if (!free) upOpen = false;
      }
      if (y < h - 1) {
        const free = !wall[row + w + x] && !region[row + w + x];
        if (free && !downOpen) { stack.push(x, y + 1); downOpen = true; } else if (!free) downOpen = false;
      }
    }
  }
  // a área cresce de volta por baixo das linhas (senão sobra uma fresta de papel junto do traço)
  const grown = dilate(region, w, h, gap + 1);
  const trapped = trap > 0 ? dilate(region, w, h, gap + 1 + trap) : null;
  let n = 0;
  for (let i = 0, j = 0; i < grown.length; i++, j += 4) {
    const paint = grown[i] || (trapped && trapped[i] && ink[i]);
    if (paint && rgba[j] < 255) { rgba[j] = rgba[j + 1] = rgba[j + 2] = 255; rgba[j + 3] = 255; n++; }
  }
  return n;
}
