// Constantes do Grão.
// Documento em unidades fixas (3:2, como a tela do tablet); máscaras em 80% disso.

export const VERSION = '0.6.0';
export const BUILD = 'b14';                // muda a cada publicação: mostra no tablet se a versão nova chegou
export const DOC_W = 1200;
export const DOC_H = 800;
export const MASK_SCALE = 0.8;            // máscara = 960 × 640, 1 canal
export const MAX_FRAMES = 12;
export const DEFAULT_FRAMES = 8;
export const FPS_OPTIONS = [6, 8, 12, 24];
export const LPI_OPTIONS = [40, 60, 85];  // lineatura da retícula reticulada, em linhas por polegada num A4 (#030)
export const PAPER_MM = 297;              // o papel do Grão equivale a um A4 deitado: 1200 unidades = 297 mm
export const REPRINTS_PER_SECOND = 8;     // "ferver": quantas reimpressões por segundo
export const WHEEL_STEP_DEG = 30;         // um frame a cada 30° de giro
export const HISTORY_MODE_MS = 3000;      // roda de histórico após tocar em Desfazer

// Gestos de 2 dedos (ADR-003, src/input/gestures.js). Rever depois do teste no tablet.
export const GESTURE_DECIDE_PX = 24;      // movimento até decidir entre TEMPO e PAPEL
export const PINCH_RATIO = 0.10;          // distância entre os dedos mudou 10%: pinça (zoom)
export const TAP_MS = 200;                // toque rápido de 2 dedos = desfazer
export const TAP_MOVE_PX = 12;
export const SCRUB_PX_PER_FRAME = 48;     // arrastar 2 dedos: 48 px = 1 frame
export const PEN_GUARD_MS = 300;          // toque até 300 ms depois da caneta = palma
export const PALM_CONTACT_PX = 40;        // área de contato maior que isso = palma

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
  // 9ª tinta (#034), para o "falso CMYK" (Azul, Vermelho vivo, Amarelo, Preto). Fica no fim para não mudar o
  // índice das tintas dos projetos salvos. A paleta do Grão fecha em 9 (decisão de 24/11).
  { name: 'Vermelho vivo', hex: '#F15060' },
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
