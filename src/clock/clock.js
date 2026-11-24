// Relógio: decide qual frame de cada camada aparece.
// Fonte de tempo trocável: hoje o relógio do navegador; na 1.1, o clock MIDI.

export class Clock {
  constructor() {
    this.t = 0;              // tempo virtual em segundos
    this.speed = 1;          // fader: -2 a 2 (negativo = ao contrário)
    this.paused = false;     // centro da roda
    this.holds = new Set();  // modos de mola que congelam: 'wheel', 'lasso'
  }

  get frozen() { return this.paused || this.holds.size > 0; }

  tick(dt) {
    if (!this.frozen) this.t += dt * this.speed;
  }

  frameOf(layer) {
    const n = layer.frames.length;
    const i = Math.floor(this.t * layer.fps + 1e-6);
    return ((i % n) + n) % n;
  }

  // Avança ou volta exatamente um frame da camada dada.
  step(layer, dir) {
    const i = Math.floor(this.t * layer.fps + 1e-6) + dir;
    this.t = i / layer.fps + 1e-4;
  }

  // Semente do "ferver": muda N vezes por segundo, mesmo com o loop congelado.
  seed(nowMs, reprints, on) {
    return on ? Math.floor((nowMs / 1000) * reprints) : 0;
  }
}
