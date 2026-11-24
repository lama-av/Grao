// Gestos de 2 dedos (ADR-003): máquina de estados pura, sem DOM. O input.js repassa os toques (em px de CSS) e
// executa o que a máquina devolve. A intenção é decidida UMA vez por gesto e não muda até os dedos saírem.
//
//              ┌── pousou sobre a seleção ──────────────────────────────→ TRANSFORMAR ('xf')
//  2 dedos ─→ DECIDINDO ─┬─ soltou rápido (< 200 ms, < 12 px) ──────────→ DESFAZER ('undo')
//  (palma     (até 24 px ├─ distância mudou ≥ 10% ──────────────────────→ PAPEL ('pan': zoom + mover)
//  filtrada)  de mov.)   └─ andaram juntos: papel em 100% e mais na horizontal → TEMPO ('time')
//                                           com zoom (ou na vertical) ─────────→ PAPEL
//
// Filtro de palma (antes de tudo): toque que começa com a caneta ENCOSTADA ou até PEN_GUARD_MS depois de ela
// levantar é ignorado; toque com área de contato maior que PALM_CONTACT_PX também. Ignorado fica ignorado até
// sair. (A roda não passa por aqui: o input.js entrega à roda antes.)
// rc.3 (teste do Raphael, 24/11): a caneta PAIRANDO não bloqueia mais os toques. Com a caneta na mão, ela fica
// a poucos cm da tela e manda eventos o tempo todo; todo dedo virava "palma". Pairando, o input.js só impede o
// dedo de RISCAR (penNear), e os gestos de 2 dedos funcionam.
//
// Ações devolvidas (listas): {type:'ignored'} · {type:'xf-begin', start} · {type:'xf', start, now} ·
// {type:'pan-begin', start} · {type:'pan', start, now} · {type:'time-begin'} · {type:'scrub', frames} ·
// {type:'undo'} · {type:'end', intent, moved, quick} · {type:'cancel', intent, frames}
// start/now = { a: {x, y}, b: {x, y} } (os dois dedos, em px de CSS).

import {
  GESTURE_DECIDE_PX, PINCH_RATIO, TAP_MS, TAP_MOVE_PX, SCRUB_PX_PER_FRAME, PEN_GUARD_MS, PALM_CONTACT_PX,
} from '../config.js';

const HOVER_STALE_MS = 1000;   // caneta "pairando" sem mandar eventos há mais que isso: considera que saiu

export function createGestures(cfg = {}) {
  const C = {
    decidePx: GESTURE_DECIDE_PX, pinchRatio: PINCH_RATIO, tapMs: TAP_MS, tapMovePx: TAP_MOVE_PX,
    scrubPx: SCRUB_PX_PER_FRAME, penGuardMs: PEN_GUARD_MS, palmPx: PALM_CONTACT_PX, ...cfg,
  };
  const touches = new Map();          // id -> { x, y, x0, y0, ignored }
  let g = null;                       // gesto em andamento
  const pen = { contact: false, hover: false, last: -Infinity };
  const stats = { ignored: 0, lastW: null, lastH: null, lastReason: '' };

  // ---------- caneta (para o filtro de palma) ----------
  function penEvent(t, contact) {
    if (pen.contact && !contact) pen.lifted = t;          // acabou de levantar: guarda de PEN_GUARD_MS
    pen.contact = contact; pen.hover = !contact; pen.last = t;
  }
  function penGone(t) { pen.contact = false; pen.hover = false; pen.last = t; pen.lifted = Math.min(pen.lifted ?? t, t); }
  // Motivo para ignorar o toque ('' = vale).
  function palmReason(t, w, h) {
    if (pen.contact) return 'caneta encostada';
    if (t - (pen.lifted ?? -Infinity) < C.penGuardMs || (!pen.hover && t - pen.last < C.penGuardMs)) return 'caneta acabou de sair';
    if ((w > C.palmPx) || (h > C.palmPx)) return 'contato largo';
    return '';
  }
  // Caneta pairando perto da tela (mandou evento há pouco): o dedo não risca, mas gesto vale.
  const penNear = (t) => pen.contact || (pen.hover && t - pen.last < HOVER_STALE_MS) || t - pen.last < C.penGuardMs;

  const pos = (id) => { const p = touches.get(id); return { x: p.x, y: p.y }; };
  const pair = () => ({ a: pos(g.a), b: pos(g.b) });
  const dist = (p) => Math.hypot(p.b.x - p.a.x, p.b.y - p.a.y);
  const mid = (p) => ({ x: (p.a.x + p.b.x) / 2, y: (p.a.y + p.b.y) / 2 });

  // ---------- toques ----------
  function down(tc, ctx = {}) {
    stats.lastW = tc.w ?? null; stats.lastH = tc.h ?? null;
    const why = palmReason(tc.t, tc.w || 0, tc.h || 0);
    if (why) {
      touches.set(tc.id, { x: tc.x, y: tc.y, x0: tc.x, y0: tc.y, ignored: true });
      stats.ignored++;
      stats.lastReason = why;
      return [{ type: 'ignored' }];
    }
    touches.set(tc.id, { x: tc.x, y: tc.y, x0: tc.x, y0: tc.y, ignored: false });
    const active = [...touches].filter(([, p]) => !p.ignored).map(([id]) => id);
    if (active.length !== 2 || g) return [];
    const [a, b] = active;
    g = { a, b, t0: tc.t, moved: 0, intent: 'deciding', scrubbed: 0, lifted: new Set(), cancelled: false };
    // o movimento conta a partir daqui (o primeiro dedo pode ter andado sozinho antes, desenhando com o dedo)
    for (const id of [a, b]) { const q = touches.get(id); q.x0 = q.x; q.y0 = q.y; }
    g.start = pair();
    if (ctx.overSelection?.(g.start.a, g.start.b)) {
      g.intent = 'xf';
      return [{ type: 'xf-begin', start: g.start }];
    }
    return [];
  }

  function move(tc, ctx = {}) {
    const p = touches.get(tc.id);
    if (!p) return [];
    p.x = tc.x; p.y = tc.y;
    if (p.ignored || !g || (tc.id !== g.a && tc.id !== g.b) || g.lifted.size) return [];
    for (const id of [g.a, g.b]) {
      const q = touches.get(id);
      g.moved = Math.max(g.moved, Math.hypot(q.x - q.x0, q.y - q.y0));
    }
    const now = pair();
    if (g.intent === 'xf') return [{ type: 'xf', start: g.start, now }];
    if (g.intent === 'pan') return [{ type: 'pan', start: g.start, now }];
    if (g.intent === 'time') return scrub(now);
    // decidindo: espera um dedo andar C.decidePx. Os eventos chegam um dedo de cada vez, então um dedo sempre
    // sai na frente; por isso a pinça não é só "a distância mudou 10%": a mudança de distância também precisa
    // ser grande perto do quanto o meio dos dedos andou (arrastar junto quase não muda a distância).
    if (g.moved < C.decidePx) return [];
    const d0 = dist(g.start), dd = Math.abs(dist(now) - d0);
    const m0 = mid(g.start), m1 = mid(now);
    const dx = m1.x - m0.x, dy = m1.y - m0.y;
    if (dd >= C.pinchRatio * d0 && dd > 0.5 * Math.hypot(dx, dy)) {
      g.intent = 'pan';
      return [{ type: 'pan-begin', start: g.start }, { type: 'pan', start: g.start, now }];
    }
    {
      if (ctx.fit && Math.abs(dx) > Math.abs(dy)) {
        g.intent = 'time';
        return [{ type: 'time-begin' }, ...scrub(now)];
      }
      g.intent = 'pan';
      return [{ type: 'pan-begin', start: g.start }, { type: 'pan', start: g.start, now }];
    }
  }

  // TEMPO: um frame a cada C.scrubPx de deslocamento horizontal do meio dos dedos (direita = para frente).
  function scrub(now) {
    const total = Math.trunc((mid(now).x - mid(g.start).x) / C.scrubPx);
    const delta = total - g.scrubbed;
    if (!delta) return [];
    g.scrubbed = total;
    return [{ type: 'scrub', frames: delta }];
  }

  function up(id, t, cancelled = false) {
    const p = touches.get(id);
    touches.delete(id);
    if (!p || p.ignored || !g || (id !== g.a && id !== g.b)) return [];
    g.lifted.add(id);
    if (cancelled) g.cancelled = true;
    if (g.lifted.size < 2 && touches.has(g.a === id ? g.b : g.a)) return [];
    const done = g;
    g = null;
    const quick = t - done.t0 < C.tapMs && done.moved < C.tapMovePx;
    if (done.intent === 'deciding') {
      return quick && !done.cancelled ? [{ type: 'undo' }] : [{ type: 'end', intent: 'none', moved: done.moved, quick }];
    }
    if (done.cancelled) return [{ type: 'cancel', intent: done.intent, frames: done.scrubbed }];
    return [{ type: 'end', intent: done.intent, moved: done.moved, quick }];
  }

  return {
    down, move, up, penEvent, penGone, stats, penNear,
    get intent() { return g?.intent ?? null; },
    get active() { return !!g; },
  };
}
