// Relógio: decide qual frame de cada camada aparece.
// Fonte de tempo trocável: hoje o relógio do navegador; na 1.1, o clock MIDI.
// Exposição (v0.5): um frame pode ficar 1 a 4 tempos (layer.expo); ver doc/project.js.

import { frameAtTick, frameStartTick, expoOf, layerTicks } from '../doc/project.js';

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
    return frameAtTick(layer, Math.floor(this.t * layer.fps + 1e-6));
  }

  // Posição no loop: tempo inteiro atual, tempo dentro da volta e o frame.
  #where(layer) {
    const tick = Math.floor(this.t * layer.fps + 1e-6);
    const total = layerTicks(layer);
    const k = ((tick % total) + total) % total;
    return { tick, loopStart: tick - k, f: frameAtTick(layer, tick) };
  }

  // Avança ou volta exatamente um frame da camada dada (pulando a exposição inteira do frame).
  step(layer, dir) {
    const { loopStart, f } = this.#where(layer);
    const n = layer.frames.length;
    const start = loopStart + frameStartTick(layer, f);
    const target = dir > 0 ? start + expoOf(layer, f) : start - expoOf(layer, (f - 1 + n) % n);
    this.t = target / layer.fps + 1e-4;
  }

  // Vai para o começo do frame f da camada (na volta atual do loop).
  goTo(layer, f) {
    const { loopStart } = this.#where(layer);
    this.t = (loopStart + frameStartTick(layer, f)) / layer.fps + 1e-4;
  }

  // Semente do "ferver": muda N vezes por segundo, mesmo com o loop congelado.
  seed(nowMs, reprints, on) {
    return on ? Math.floor((nowMs / 1000) * reprints) : 0;
  }
}
