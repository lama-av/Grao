// Entrada no canvas: caneta desenha e faz laço; dedos só para gestos de 2 dedos.
// Toque de 1 dedo nunca desenha (proteção contra a palma). pointercancel descarta o traço.
// O #wet fica no topo e recebe todos os eventos: primeiro pergunta à roda (app.ui.down) se o toque é dela;
// o resto vai para o papel. O #wet guarda só o traço molhado e o laço; a caixa da seleção vai para o #ui.

import { DOC_W, DOC_H, INKS, PAPERS, TAP_MOVE_PX } from '../config.js';
import { newStroke, cloneStroke, boundsOf, fillDependents } from '../doc/project.js';
import { BRUSHES } from '../render/stroke.js';
import { drawLastSegment, drawStroke } from '../render/stroke.js';
import { uvToDoc, pinch, settle, isFit } from '../view.js';
import { createGestures } from './gestures.js';

// Captura o ponteiro; ignora a falha quando o ponteiro já sumiu (eventos sintéticos, cancelamentos).
function capture(el, e) { try { el.setPointerCapture(e.pointerId); } catch { /* sem captura */ } }

const SELECTION_MARGIN_PX = 80; // ~2 cm de folga para pousar 2 dedos sobre seleções pequenas

// Botões da caneta (valores de PointerEvent.buttons). A ponta encostada é 1.
// Botão lateral 1: o Chrome reporta 2 (como o botão direito do mouse) → alterna Pincel / Borracha.
// Botão lateral 2: o Chrome do Android reporta 4 (meio) ou 32 (borracha), conforme o aparelho → segura o Laço.
// Linha reta (T-023): segurar a caneta parada no fim do traço endireita a linha; depois dá para mover a ponta.
const LINE_HOLD_MS = 500;
const LINE_STILL = 4;       // unidades do documento: tremida que ainda conta como "parada"
const LINE_MIN = 20;        // traço precisa ter pelo menos isso para virar linha

const TIP = 1;
const BTN_TOGGLE = 2;
const BTN_LASSO = 4 | 32;
// Quando o botão 2 vira "borracha" (32), o Chrome manda o contato como 32, sem o bit da ponta.
const CONTACT = TIP | 32;

export function setupInput(app, wetCanvas) {
  // No Chrome do Android, o canvas "desynchronized" vai direto para a tela sem misturar transparência:
  // as partes vazias ficam pretas e escondem o papel. Por isso fica desligado por padrão.
  // Para testar a baixa latência no tablet: abrir com ?baixa=1 no fim do endereço.
  const wantLowLatency = new URLSearchParams(location.search).get('baixa') === '1';
  const ctx = wetCanvas.getContext('2d', { desynchronized: wantLowLatency, alpha: true });
  app.lowLatency = !!ctx.getContextAttributes?.().desynchronized;

  let mode = null;        // 'draw' | 'lasso' | 'move' | 'fill'
  let line = null;        // linha reta: { timer, ax, ay (ponto parado), on (já endireitou) }
  let smooth = null;      // suavização: ponto suavizado atual e último ponto real
  // 0 = sem suavização (padrão). Até 0,85: cada ponto anda 15% do caminho até a caneta.
  const smoothFactor = () => (app.project.settings.smooth || 0) * 0.85;
  let stroke = null;
  let target = null;      // { l, f }
  let lasso = [];
  let moveStart = null;   // { x, y, snap: Map(id -> {pts, w}), before }
  const gestures = createGestures();   // decide o que 2 dedos fazem (ADR-003)
  let xfState = null;     // TRANSFORMAR: { start, t }
  let panStart = null;    // PAPEL: vista e dedos no começo
  let timeStart = null;   // TEMPO: tempo do relógio no começo (para cancelar)
  const uiPointers = new Set(); // ponteiros que começaram na roda: move/up vão para ela
  let penBtns = 0;              // botões laterais vistos no último evento da caneta

  function resize() {
    const r = wetCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    wetCanvas.width = Math.round(r.width * dpr);
    wetCanvas.height = Math.round(r.height * dpr);
    redrawOverlay();
  }

  // Desenhamos em unidades do documento, com o zoom e a posição do papel (src/view.js).
  function applyView() {
    const v = app.view || { s: 1, ox: 0, oy: 0 };
    const k = (wetCanvas.width / DOC_W) * v.s;
    ctx.setTransform(k, 0, 0, k, v.ox * wetCanvas.width, v.oy * wetCanvas.height);
  }

  function toDoc(e) {
    const r = wetCanvas.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width, w = (e.clientY - r.top) / r.height;
    return app.view ? uvToDoc(app.view, u, w) : { x: u * DOC_W, y: w * DOC_H };
  }
  const zoom = () => app.view?.s || 1;

  function isPen(e) { return e.pointerType === 'pen' || e.pointerType === 'mouse'; }

  function pressureOf(e) {
    if (e.pointerType === 'mouse') return 0.5;
    return e.pressure > 0 ? e.pressure : 0.5;
  }

  function clearWet() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, wetCanvas.width, wetCanvas.height);
    ctx.restore();
  }

  function redrawOverlay() {
    applyView();
    clearWet();
    if (mode === 'lasso' && lasso.length > 1) {
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(lasso[0].x, lasso[0].y);
      for (const p of lasso) ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function selectedStrokes() {
    const sel = app.selection;
    if (!sel) return [];
    const fr = app.project.layers[sel.l].frames[sel.f] || [];
    return fr.filter((s) => sel.ids.has(s.id));
  }

  function selectionBounds() {
    const list = selectedStrokes();
    return list.length ? boundsOf(list) : null;
  }

  function insideBounds(p, b, marginDoc = 0) {
    return b && p.x >= b.x0 - marginDoc && p.x <= b.x1 + marginDoc && p.y >= b.y0 - marginDoc && p.y <= b.y1 + marginDoc;
  }

  // Transformação da seleção (mover com a caneta; mover, girar e escalar com 2 dedos).
  // Troca os traços selecionados por clones e só mexe nos clones: o "antes" do desfazer fica intacto.
  // Se o frame for trocado no meio (desfazer, abrir arquivo, projeto novo), a transformação morre sem tocar em nada.
  function beginTransform() {
    const sel = app.selection;
    const fr = app.project.layers[sel.l].frames[sel.f];
    const xf = { l: sel.l, f: sel.f, frame: fr, before: fr.slice(), items: [] };
    for (let i = 0; i < fr.length; i++) {
      if (sel.ids.has(fr[i].id)) {
        fr[i] = cloneStroke(fr[i]);
        xf.items.push({ s: fr[i], pts: fr[i].pts.slice(), w: fr[i].w });
      }
    }
    return xf;
  }

  const alive = (xf) => app.project.layers[xf.l]?.frames[xf.f] === xf.frame;

  // Devolve false se a transformação morreu (o frame foi trocado por outro caminho).
  function applyMatrix(xf, m) {
    if (!alive(xf)) return false;
    for (const { s, pts, w } of xf.items) {
      for (let i = 0; i < pts.length; i += 3) {
        const x = pts[i], y = pts[i + 1];
        s.pts[i] = m.a * x + m.c * y + m.e;
        s.pts[i + 1] = m.b * x + m.d * y + m.f;
      }
      s.w = w * m.scale;
    }
    app.markDirty(xf.l, xf.f);
    return true;
  }

  // Desiste: o frame volta à lista de antes (os traços originais).
  function restoreFrame(xf) {
    if (!alive(xf)) return;
    app.project.layers[xf.l].frames[xf.f] = xf.before.slice();
    app.markDirty(xf.l, xf.f);
  }

  function endTransform(xf) {
    if (!alive(xf)) return;
    app.history.push({ l: xf.l, f: xf.f, before: xf.before, after: xf.frame.slice() });
    app.requestSave();
  }

  // ---------- botões da caneta ----------
  // Lê os botões laterais em todo evento da caneta (no ar ou encostada) e age só na borda (apertou / soltou).
  function penButtons(e) {
    const b = e.buttons & (BTN_TOGGLE | BTN_LASSO);
    const rise = b & ~penBtns;
    penBtns = b;
    if (rise & BTN_TOGGLE) toggleEraser();
    setLassoHeld((b & BTN_LASSO) !== 0);
  }

  // Alterna a Borracha com o último pincel usado (Pincel, Lápis, Marcador ou Giz).
  function toggleEraser() {
    if (app.tool === 'eraser') app.tool = app.lastBrush || 'brush';
    else { if (BRUSHES[app.tool]) app.lastBrush = app.tool; app.tool = 'eraser'; }
    app.ui?.say(app.tool === 'eraser' ? 'Borracha' : BRUSHES[app.tool].name);
  }

  // Modo de mola: enquanto o botão do Laço estiver apertado, a caneta faz laço e o loop fica parado.
  function setLassoHeld(on) {
    if (app.lassoHeld === on) return;
    app.lassoHeld = on;
    if (on) { app.clock.holds.add('lasso'); app.ui?.say('Laço'); }
    else app.clock.holds.delete('lasso');
  }

  // A caneta saiu do alcance (ou o app perdeu o foco): solta o Laço e zera a leitura dos botões.
  function penAway() {
    if (mode) return;
    penBtns = 0;
    setLassoHeld(false);
  }

  const tipOf = (e) => (e.buttons & CONTACT) !== 0 || (e.type === 'pointerdown' && e.button === 0 && e.buttons === 0);

  // ---------- caneta ----------
  // A caneta perto da tela (encostada ou pairando) avisa o filtro de palma dos gestos.
  function penSeen(e) {
    if (e.pointerType === 'pen') gestures.penEvent(performance.now(), (e.buttons & CONTACT) !== 0);
  }

  wetCanvas.addEventListener('pointerdown', (e) => {
    app.debug?.pointer(e);
    penSeen(e);
    if (app.recording) return;                // gravando o vídeo: o papel e a roda esperam
    if (isPen(e)) {
      penButtons(e);
      // Botão lateral apertado com a caneta no ar: só troca de ferramenta, não toca na roda nem no papel.
      if (!tipOf(e)) return;
    }
    beginContact(e);
  });

  // Ponta encostou (no pointerdown, ou num pointermove quando um botão lateral já estava apertado).
  function beginContact(e) {
    if (app.ui?.down(e)) { capture(wetCanvas, e); uiPointers.add(e.pointerId); return; }
    app.ui?.paperDown(e);
    if (!isPen(e)) { touchDown(e); return; }
    capture(wetCanvas, e);
    const p = toDoc(e);
    const layer = app.project.layers[app.project.activeLayer];

    // Com o botão do laço segurado, a caneta sempre faz laço. Com o Laço fixo (roda), dentro da seleção ela move.
    if (!app.lassoHeld && app.selection && insideBounds(p, selectionBounds())) {
      mode = 'move';
      moveStart = { x: p.x, y: p.y, moved: false, xf: beginTransform() };
      return;
    }
    if (app.lassoHeld || app.tool === 'lasso') {
      app.clock.holds.add('lassoTool'); // desenhando o laço, o loop fica parado
      mode = 'lasso';
      lasso = [p];
      app.selection = null;
      app.onSelectionChange?.();
      redrawOverlay();
      return;
    }
    if (app.selection) { app.selection = null; redrawOverlay(); app.onSelectionChange?.(); }

    target = { l: app.project.activeLayer, f: app.clock.frameOf(layer) };
    if (app.tool === 'bucket') {
      // Balde: um toque preenche a área fechada em volta do ponto, com a tinta da camada.
      mode = 'fill';
      const fill = newStroke(app.project, 'fill', 1);
      fill.pts.push(p.x, p.y, 1);
      const fr = app.project.layers[target.l].frames[target.f];
      // Testa antes de gravar: tocar em cima de uma linha não pinta nada e não vira passo de desfazer.
      const painted = app.masks?.tryFill ? app.masks.tryFill(target.l, target.f, fr, fill, app.project) : -1;
      if (painted === 0) { app.ui?.say('Nada para pintar'); return; }
      commitStroke(fill, painted < 0);      // se o teste já pintou, a máscara está pronta
      return;
    }
    const cut = app.tool === 'eraser';
    const brush = BRUSHES[app.tool] ? app.tool : (app.lastBrush || 'brush');
    const sizes = app.project.settings.sizes;
    mode = 'draw';
    stroke = newStroke(app.project, cut ? 'cut' : 'ink', cut ? sizes.eraser : sizes[brush], brush);
    stroke.pts.push(p.x, p.y, pressureOf(e));
    smooth = { x: p.x, y: p.y, last: null };
    drawLastSegment(ctx, stroke, colorFor(stroke));
    line = { timer: 0, ax: p.x, ay: p.y, on: false };
    armLine();
  }

  function commitStroke(s, dirty = true) {
    const fr = app.project.layers[target.l].frames[target.f];
    const before = fr.slice();
    fr.push(s);
    app.history.push({ l: target.l, f: target.f, before, after: fr.slice() });
    if (dirty) app.markDirty(target.l, target.f);
    else for (const d of fillDependentsOf(target.l, target.f)) app.markDirty(d.l, d.f);
    app.requestSave();
  }
  const fillDependentsOf = (l, f) => fillDependents(app.project, l, f);

  // ---------- linha reta ----------
  function armLine() {
    clearTimeout(line.timer);
    line.timer = setTimeout(straighten, LINE_HOLD_MS);
  }
  function straighten() {
    if (mode !== 'draw' || !line || line.on) return;
    const p = stroke.pts;
    const n = p.length;
    if (Math.hypot(p[n - 3] - p[0], p[n - 2] - p[1]) < LINE_MIN) return;
    let sum = 0;
    for (let i = 2; i < n; i += 3) sum += p[i];
    const pr = sum / (n / 3);                // pressão média: a linha fica com espessura uniforme
    stroke.pts = [p[0], p[1], pr, p[n - 3], p[n - 2], pr];
    line.on = true;
    line.pressure = pr;
    redrawWetStroke();
    app.ui?.say('Linha');
  }
  // Depois de endireitar, a ponta da linha segue a caneta.
  function moveLineEnd(q) {
    const s = stroke.pts;
    s[3] = q.x; s[4] = q.y;
    redrawWetStroke();
  }
  function redrawWetStroke() {
    clearWet();
    drawStroke(ctx, stroke, 1, colorFor(stroke));
  }

  wetCanvas.addEventListener('pointermove', (e) => {
    penSeen(e);
    if (isPen(e)) penButtons(e);
    if (uiPointers.has(e.pointerId)) { app.ui.move(e); return; }
    if (!isPen(e)) { touchMove(e); return; }
    if (e.pointerType === 'pen') app.debug?.pointer(e);
    const tip = (e.buttons & CONTACT) !== 0;
    if (!mode) {
      // Com um botão lateral apertado, o Chrome avisa a ponta encostando por pointermove, não por pointerdown.
      if (tip && e.buttons !== TIP && !app.recording) beginContact(e);
      return;
    }
    // Ponta levantou com um botão lateral ainda apertado: também chega como pointermove.
    if (!tip && e.pressure === 0) { finishPen(e, false); return; }
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (mode === 'draw') {
      if (line.on) { moveLineEnd(toDoc(e)); return; }
      const color = colorFor(stroke);
      const k = smoothFactor();
      for (const ce of events.length ? events : [e]) {
        const p = toDoc(ce);
        smooth.last = { x: p.x, y: p.y };   // cópia: p vira o ponto suavizado logo abaixo
        if (k) { smooth.x += (p.x - smooth.x) * (1 - k); smooth.y += (p.y - smooth.y) * (1 - k); p.x = smooth.x; p.y = smooth.y; }
        stroke.pts.push(p.x, p.y, pressureOf(ce));
        drawLastSegment(ctx, stroke, color);
      }
      const q = toDoc(e);
      if (Math.hypot(q.x - line.ax, q.y - line.ay) > LINE_STILL) { line.ax = q.x; line.ay = q.y; armLine(); }
    } else if (mode === 'lasso') {
      lasso.push(toDoc(e));
      redrawOverlay();
    } else if (mode === 'move') {
      const p = toDoc(e);
      const dx = p.x - moveStart.x, dy = p.y - moveStart.y;
      if (Math.hypot(dx, dy) > 1) moveStart.moved = true;
      if (!applyMatrix(moveStart.xf, { a: 1, b: 0, c: 0, d: 1, e: dx, f: dy, scale: 1 })) { mode = null; moveStart = null; }
      redrawOverlay();
    }
  });

  function finishPen(e, cancelled) {
    if (!mode) return;
    if (mode === 'draw') {
      clearTimeout(line?.timer);
      // Com suavização, o traço fica para trás da caneta: no fim, ele alcança o último ponto real.
      if (smoothFactor() && smooth?.last && !line?.on) {
        const n = stroke.pts.length;
        stroke.pts.push(smooth.last.x, smooth.last.y, stroke.pts[n - 1]);
      }
      line = null;
      if (!cancelled && stroke.pts.length >= 3) {
        commitStroke(stroke);
        app.onStrokeCommitted?.(target);
      }
      stroke = null;
      clearWet();
    } else if (mode === 'lasso') {
      app.clock.holds.delete('lassoTool');
      if (cancelled) lasso = []; else selectWithLasso();
    } else if (mode === 'move') {
      // toque sem mover não vira passo de desfazer; cancelado (palma, sistema) volta ao lugar
      if (!cancelled && moveStart.moved) endTransform(moveStart.xf);
      else restoreFrame(moveStart.xf);
      moveStart = null;
    }
    mode = null;
    redrawOverlay();
  }

  wetCanvas.addEventListener('pointerup', (e) => {
    if (e.pointerType === 'pen') gestures.penEvent(performance.now(), false);   // levantou: continua pairando
    if (uiPointers.delete(e.pointerId)) { app.ui.up(e, false); if (isPen(e)) penButtons(e); return; }
    if (isPen(e)) { finishPen(e, false); penButtons(e); } else touchUp(e);
  });
  wetCanvas.addEventListener('pointercancel', (e) => {
    if (uiPointers.delete(e.pointerId)) { app.ui.up(e, true); if (isPen(e)) penAway(); return; }
    if (isPen(e)) { finishPen(e, true); penAway(); } else touchUp(e, true);
  });
  wetCanvas.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'pen') { penAway(); gestures.penGone(performance.now()); }
  });
  window.addEventListener('blur', penAway);
  wetCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

  function colorFor(s) {
    if (s.kind === 'cut') return PAPERS[app.project.paper].hex;
    const layer = app.project.layers[app.project.activeLayer];
    return INKS[layer.ink].hex;
  }

  function selectWithLasso() {
    const l = app.project.activeLayer;
    const layer = app.project.layers[l];
    const f = app.clock.frameOf(layer);
    const ids = new Set();
    if (lasso.length > 2) {
      for (const s of layer.frames[f]) {
        if (s.kind === 'cut') continue;          // pincel e balde podem ser laçados; borracha não
        for (let i = 0; i < s.pts.length; i += 3) {
          if (pointInPolygon(s.pts[i], s.pts[i + 1], lasso)) { ids.add(s.id); break; }
        }
      }
    }
    lasso = [];
    app.selection = ids.size ? { l, f, ids } : null;
    app.onSelectionChange?.();
  }

  // ---------- dedos (2 dedos) ----------
  // A decisão fica na máquina de gestos (src/input/gestures.js); aqui só executamos a intenção.
  const touchOf = (e) => ({ id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), w: e.width || 0, h: e.height || 0 });
  const docOf = (p) => toDoc({ clientX: p.x, clientY: p.y });

  function gestureCtx() {
    return {
      fit: !app.view || isFit(app.view),
      overSelection(a, b) {
        const sb = selectionBounds();
        if (!sb) return false;
        const r = wetCanvas.getBoundingClientRect();
        const marginDoc = (SELECTION_MARGIN_PX / r.width) * DOC_W / zoom();
        return insideBounds(docOf(a), sb, marginDoc) && insideBounds(docOf(b), sb, marginDoc);
      },
    };
  }

  function touchDown(e) {
    capture(wetCanvas, e);
    run(gestures.down(touchOf(e), gestureCtx()));
  }
  function touchMove(e) { run(gestures.move(touchOf(e), gestureCtx())); }
  function touchUp(e, cancelled) { run(gestures.up(e.pointerId, performance.now(), cancelled)); }

  // Meio e distância de 2 dedos em uv da tela.
  function screenPair(p) {
    const r = wetCanvas.getBoundingClientRect();
    return {
      mid: { u: ((p.a.x + p.b.x) / 2 - r.left) / r.width, w: ((p.a.y + p.b.y) / 2 - r.top) / r.height },
      dist: Math.hypot((p.b.x - p.a.x) / r.width, (p.b.y - p.a.y) / r.width),
    };
  }

  function activeLayer() { return app.project.layers[app.project.activeLayer]; }

  function run(actions) {
    for (const act of actions) {
      switch (act.type) {
        case 'xf-begin':
          xfState = { start: twoFinger(docOf(act.start.a), docOf(act.start.b)), t: beginTransform() };
          break;
        case 'xf': {
          if (!xfState) break;
          const now = twoFinger(docOf(act.now.a), docOf(act.now.b));
          const s0 = xfState.start;
          const scale = Math.max(0.1, now.dist / Math.max(1, s0.dist));
          const rot = now.angle - s0.angle;
          const cos = Math.cos(rot) * scale, sin = Math.sin(rot) * scale;
          // gira e escala em volta do centro inicial, depois desloca para o centro atual
          const m = {
            a: cos, b: sin, c: -sin, d: cos,
            e: now.cx - (cos * s0.cx - sin * s0.cy),
            f: now.cy - (sin * s0.cx + cos * s0.cy),
            scale,
          };
          if (!applyMatrix(xfState.t, m)) xfState = null;   // a seleção foi trocada no meio: para de girar
          redrawOverlay();
          break;
        }
        case 'pan-begin':
          if (app.view) panStart = { view: { ...app.view }, ...screenPair(act.start) };
          break;
        case 'pan':
          if (!panStart) break;
          pinch(app.view, panStart, screenPair(act.now));
          redrawOverlay();
          app.ui?.say(`${Math.round(app.view.s * 100)}%`);
          break;
        case 'time-begin':
          timeStart = app.clock.t;
          app.clock.holds.add('scrub');       // o loop espera enquanto os dedos andam no tempo
          app.ui?.ruler?.(true);
          break;
        case 'scrub': {
          const layer = activeLayer();
          const dir = Math.sign(act.frames);
          for (let i = 0; i < Math.abs(act.frames); i++) app.clock.step(layer, dir);
          app.ui?.say(`${app.clock.frameOf(layer) + 1}/${layer.frames.length}`);
          break;
        }
        case 'undo':
          app.undo();
          break;
        case 'end':
        case 'cancel':
          finishGesture(act);
          break;
        default:
      }
    }
  }

  function finishGesture(act) {
    const cancelled = act.type === 'cancel';
    if (act.intent === 'xf' && xfState) {
      if (!cancelled && act.moved >= TAP_MOVE_PX) endTransform(xfState.t);
      else {
        restoreFrame(xfState.t);
        if (!cancelled && act.quick) app.undo();   // toque rápido sobre a seleção também desfaz
      }
      xfState = null;
    } else if (act.intent === 'pan') {
      settle(app.view);                        // perto de 100%: encaixa o papel inteiro
      if (app.view.s === 1) app.ui?.say('100%');
      panStart = null;
    } else if (act.intent === 'time') {
      if (cancelled && timeStart !== null) app.clock.t = timeStart;   // cancelado pelo sistema: volta ao frame de antes
      app.clock.holds.delete('scrub');
      app.ui?.ruler?.(false);
      timeStart = null;
    }
    redrawOverlay();
  }

  function twoFinger(a, b) {
    return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  new ResizeObserver(resize).observe(wetCanvas);
  resize();

  return {
    redrawOverlay, clearWet, selectionBounds, gestures,
    get transforming() { return !!(moveStart || xfState); },
  };
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
