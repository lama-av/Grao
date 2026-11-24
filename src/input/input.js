// Entrada no canvas: caneta desenha e faz laço; dedos só para gestos de 2 dedos.
// Toque de 1 dedo nunca desenha (proteção contra a palma). pointercancel descarta o traço.
// O #wet fica no topo e recebe todos os eventos: primeiro pergunta à roda (app.ui.down) se o toque é dela;
// o resto vai para o papel. O #wet guarda só o traço molhado e o laço; a caixa da seleção vai para o #ui.

import { DOC_W, DOC_H, INKS, PAPERS } from '../config.js';
import { newStroke, cloneStroke, boundsOf } from '../doc/project.js';
import { drawLastSegment } from '../render/stroke.js';

// Captura o ponteiro; ignora a falha quando o ponteiro já sumiu (eventos sintéticos, cancelamentos).
function capture(el, e) { try { el.setPointerCapture(e.pointerId); } catch { /* sem captura */ } }

const SELECTION_MARGIN_PX = 80; // ~2 cm de folga para pousar 2 dedos sobre seleções pequenas
const TAP_MS = 200;
const TAP_MOVE_PX = 12;

export function setupInput(app, wetCanvas) {
  // No Chrome do Android, o canvas "desynchronized" vai direto para a tela sem misturar transparência:
  // as partes vazias ficam pretas e escondem o papel. Por isso fica desligado por padrão.
  // Para testar a baixa latência no tablet: abrir com ?baixa=1 no fim do endereço.
  const wantLowLatency = new URLSearchParams(location.search).get('baixa') === '1';
  const ctx = wetCanvas.getContext('2d', { desynchronized: wantLowLatency, alpha: true });
  app.lowLatency = !!ctx.getContextAttributes?.().desynchronized;

  let mode = null;        // 'draw' | 'lasso' | 'move'
  let stroke = null;
  let target = null;      // { l, f }
  let lasso = [];
  let moveStart = null;   // { x, y, snap: Map(id -> {pts, w}), before }
  const touches = new Map();
  let gesture = null;
  const uiPointers = new Set(); // ponteiros que começaram na roda: move/up vão para ela

  function resize() {
    const r = wetCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    wetCanvas.width = Math.round(r.width * dpr);
    wetCanvas.height = Math.round(r.height * dpr);
    const k = wetCanvas.width / DOC_W;
    ctx.setTransform(k, 0, 0, k, 0, 0); // desenhamos em unidades do documento
    redrawOverlay();
  }

  function toDoc(e) {
    const r = wetCanvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * DOC_W, y: ((e.clientY - r.top) / r.height) * DOC_H };
  }

  function isPen(e) { return e.pointerType === 'pen' || e.pointerType === 'mouse'; }

  function pressureOf(e) {
    if (e.pointerType === 'mouse') return 0.5;
    return e.pressure > 0 ? e.pressure : 0.5;
  }

  function clearWet() { ctx.clearRect(0, 0, DOC_W, DOC_H); }

  function redrawOverlay() {
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

  // Troca os traços selecionados por clones (o "antes" do desfazer fica intacto).
  function beginTransform() {
    const sel = app.selection;
    const fr = app.project.layers[sel.l].frames[sel.f];
    const before = fr.slice();
    const snap = new Map();
    for (let i = 0; i < fr.length; i++) {
      if (sel.ids.has(fr[i].id)) {
        fr[i] = cloneStroke(fr[i]);
        snap.set(fr[i].id, { pts: fr[i].pts.slice(), w: fr[i].w });
      }
    }
    return { before, snap };
  }

  function applyMatrix(snap, m) {
    const sel = app.selection;
    const fr = app.project.layers[sel.l].frames[sel.f];
    for (const s of fr) {
      const o = snap.get(s.id);
      if (!o) continue;
      for (let i = 0; i < o.pts.length; i += 3) {
        const x = o.pts[i], y = o.pts[i + 1];
        s.pts[i] = m.a * x + m.c * y + m.e;
        s.pts[i + 1] = m.b * x + m.d * y + m.f;
      }
      s.w = o.w * m.scale;
    }
    app.markDirty(sel.l, sel.f);
  }

  function endTransform(before) {
    const sel = app.selection;
    const fr = app.project.layers[sel.l].frames[sel.f];
    app.history.push({ l: sel.l, f: sel.f, before, after: fr.slice() });
    app.requestSave();
  }

  // ---------- caneta ----------
  wetCanvas.addEventListener('pointerdown', (e) => {
    app.debug?.pointer(e);
    if (app.ui?.down(e)) { capture(wetCanvas, e); uiPointers.add(e.pointerId); return; }
    app.ui?.paperDown(e);
    if (!isPen(e)) { touchDown(e); return; }
    if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2) return;
    capture(wetCanvas, e);
    const p = toDoc(e);
    const layer = app.project.layers[app.project.activeLayer];

    // Com o botão do laço segurado, a caneta sempre faz laço. Com o Laço fixo (roda), dentro da seleção ela move.
    if (!app.lassoHeld && app.selection && insideBounds(p, selectionBounds())) {
      mode = 'move';
      moveStart = { x: p.x, y: p.y, ...beginTransform() };
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

    // Borracha: ferramenta escolhida na roda, ou botão lateral da caneta segurado (buttons & 2; 32 = ponta borracha).
    const cut = app.tool === 'eraser' || (e.buttons & 2) || (e.buttons & 32) || e.button === 2;
    mode = 'draw';
    target = { l: app.project.activeLayer, f: app.clock.frameOf(layer) };
    stroke = newStroke(app.project, cut ? 'cut' : 'ink', app.project.settings.brush);
    stroke.pts.push(p.x, p.y, pressureOf(e));
    drawLastSegment(ctx, stroke, colorFor(stroke));
  });

  wetCanvas.addEventListener('pointermove', (e) => {
    if (uiPointers.has(e.pointerId)) { app.ui.move(e); return; }
    if (!isPen(e)) { touchMove(e); return; }
    if (e.pointerType === 'pen') app.debug?.pointer(e);
    if (!mode) return;
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (mode === 'draw') {
      const color = colorFor(stroke);
      for (const ce of events.length ? events : [e]) {
        const p = toDoc(ce);
        stroke.pts.push(p.x, p.y, pressureOf(ce));
        drawLastSegment(ctx, stroke, color);
      }
    } else if (mode === 'lasso') {
      lasso.push(toDoc(e));
      redrawOverlay();
    } else if (mode === 'move') {
      const p = toDoc(e);
      const dx = p.x - moveStart.x, dy = p.y - moveStart.y;
      applyMatrix(moveStart.snap, { a: 1, b: 0, c: 0, d: 1, e: dx, f: dy, scale: 1 });
      redrawOverlay();
    }
  });

  function finishPen(e, cancelled) {
    if (!mode) return;
    if (mode === 'draw') {
      if (!cancelled && stroke.pts.length >= 3) {
        const fr = app.project.layers[target.l].frames[target.f];
        const before = fr.slice();
        fr.push(stroke);
        app.history.push({ l: target.l, f: target.f, before, after: fr.slice() });
        app.markDirty(target.l, target.f);
        app.requestSave();
        app.onStrokeCommitted?.(target);
      }
      stroke = null;
      clearWet();
    } else if (mode === 'lasso') {
      app.clock.holds.delete('lassoTool');
      if (cancelled) lasso = []; else selectWithLasso();
    } else if (mode === 'move') {
      if (!cancelled) endTransform(moveStart.before);
      moveStart = null;
    }
    mode = null;
    redrawOverlay();
  }

  wetCanvas.addEventListener('pointerup', (e) => {
    if (uiPointers.delete(e.pointerId)) { app.ui.up(e, false); return; }
    if (isPen(e)) finishPen(e, false); else touchUp(e);
  });
  wetCanvas.addEventListener('pointercancel', (e) => {
    if (uiPointers.delete(e.pointerId)) { app.ui.up(e, true); return; }
    if (isPen(e)) finishPen(e, true); else touchUp(e, true);
  });
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
        if (s.kind !== 'ink') continue;
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
  function touchDown(e) {
    capture(wetCanvas, e);
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    if (touches.size === 2 && !gesture) {
      const [a, b] = [...touches.values()];
      gesture = { t0: performance.now(), moved: 0, xf: null };
      const sb = selectionBounds();
      if (sb) {
        const r = wetCanvas.getBoundingClientRect();
        const marginDoc = (SELECTION_MARGIN_PX / r.width) * DOC_W;
        const pa = toDoc({ clientX: a.x, clientY: a.y });
        const pb = toDoc({ clientX: b.x, clientY: b.y });
        if (insideBounds(pa, sb, marginDoc) && insideBounds(pb, sb, marginDoc)) {
          gesture.xf = { start: twoFinger(pa, pb), ...beginTransform() };
        }
      }
    }
  }

  function touchMove(e) {
    const t = touches.get(e.pointerId);
    if (!t) return;
    t.x = e.clientX; t.y = e.clientY;
    if (!gesture) return;
    gesture.moved = Math.max(gesture.moved, Math.hypot(t.x - t.x0, t.y - t.y0));
    if (gesture.xf && touches.size >= 2) {
      const [a, b] = [...touches.values()];
      const now = twoFinger(toDoc({ clientX: a.x, clientY: a.y }), toDoc({ clientX: b.x, clientY: b.y }));
      const s0 = gesture.xf.start;
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
      applyMatrix(gesture.xf.snap, m);
      redrawOverlay();
    }
  }

  function touchUp(e, cancelled) {
    touches.delete(e.pointerId);
    if (!gesture) return;
    if (touches.size === 0) {
      const quick = performance.now() - gesture.t0 < TAP_MS && gesture.moved < TAP_MOVE_PX;
      if (gesture.xf) {
        if (!cancelled && gesture.moved >= TAP_MOVE_PX) endTransform(gesture.xf.before);
        else if (quick && !cancelled) app.undo();
      } else if (quick && !cancelled) {
        app.undo();
      }
      gesture = null;
      redrawOverlay();
    }
  }

  function twoFinger(a, b) {
    return { cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, dist: Math.hypot(b.x - a.x, b.y - a.y), angle: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  new ResizeObserver(resize).observe(wetCanvas);
  resize();

  return { redrawOverlay, clearWet, selectionBounds };
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
