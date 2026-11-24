// Constantes do Grão.
// Documento em unidades fixas (3:2, como a tela do tablet); máscaras em 80% disso.

export const VERSION = '0.2.0';
export const BUILD = 'b7';                // muda a cada publicação: mostra no tablet se a versão nova chegou
export const DOC_W = 1200;
export const DOC_H = 800;
export const MASK_SCALE = 0.8;            // máscara = 960 × 640, 1 canal
export const MAX_FRAMES = 12;
export const DEFAULT_FRAMES = 8;
export const FPS_OPTIONS = [6, 8, 12, 24];
export const REPRINTS_PER_SECOND = 8;     // "ferver": quantas reimpressões por segundo
export const WHEEL_STEP_DEG = 30;         // um frame a cada 30° de giro
export const HISTORY_MODE_MS = 3000;      // roda de histórico após tocar em Desfazer

// Cores da lista riso-colors, de Matt DesLauriers (MIT).
// https://github.com/mattdesl/riso-colors
export const INKS = [
  { name: 'Rosa flúor', hex: '#FF48B0' },
  { name: 'Azul',       hex: '#0078BF' },
  { name: 'Amarelo',    hex: '#FFE800' },
  { name: 'Preto',      hex: '#000000' },
  { name: 'Verde',      hex: '#00A95C' },
  { name: 'Laranja',    hex: '#FF6C2F' },
  { name: 'Teal',       hex: '#00838A' },
  { name: 'Azul federal', hex: '#3D5588' },
];
export const DEFAULT_INKS = [0, 1, 2, 3];

// Papel = cor + fibras + impurezas + textura (ver docs/05-motor-riso.md).
export const PAPERS = {
  natural:   { name: 'Natural',   hex: '#F3EFE6', fiber: 0.25, incl: 0.12, tex: 0.20 },
  jornal:    { name: 'Jornal',    hex: '#ECE7DB', fiber: 0.45, incl: 0.30, tex: 0.30 },
  kraft:     { name: 'Kraft',     hex: '#D8C29E', fiber: 0.55, incl: 0.15, tex: 0.40 },
  reciclado: { name: 'Reciclado', hex: '#EBE5D6', fiber: 0.50, incl: 0.60, tex: 0.35 },
};

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
