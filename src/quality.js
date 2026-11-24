// Qualidade automática (v0.9, #060, T-081): se o tablet não segura os quadros, o compositor riso desenha em
// resolução menor (o traço molhado e a roda continuam nítidos, porque estão em outros canvases).
// Mede o intervalo entre quadros (o tempo da GPU não é medido direto no navegador sem extensão).
//
// Níveis: fração da densidade de pixels da tela usada no canvas do riso.

export const LEVELS = [1.5, 1.0, 0.75, 0.5];
const WINDOW = 90;            // quadros por medição (~1,5 s a 60 fps)
const SLOW_MS = 19;           // média acima disso (< ~52 quadros/s): desce um nível
const FAST_MS = 15;           // média abaixo disso por 10 s seguidos: sobe um nível
const FAST_WINDOWS = 6;

export function createQuality(start = 0) {
  let level = start, samples = [], fastStreak = 0;
  return {
    get level() { return level; },
    get scale() { return LEVELS[level]; },
    // dt em ms; devolve true quando o nível mudou (o canvas precisa mudar de tamanho).
    sample(dt, enabled = true) {
      if (!enabled) { if (level !== 0) { level = 0; samples = []; return true; } return false; }
      if (dt > 250) return false;                    // aba voltou de segundo plano: não conta
      samples.push(dt);
      if (samples.length < WINDOW) return false;
      const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
      samples = [];
      if (avg > SLOW_MS && level < LEVELS.length - 1) { level++; fastStreak = 0; return true; }
      if (avg < FAST_MS) {
        if (++fastStreak >= FAST_WINDOWS && level > 0) { level--; fastStreak = 0; return true; }
      } else fastStreak = 0;
      return false;
    },
  };
}
