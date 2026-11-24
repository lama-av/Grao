// Roda de canto (v0.2): desenhada no canvas #ui, por baixo do traço molhado.
// Recolhida: botão de 64 px no canto da mão livre. Aberta: centro (tocar/pausar), 6 setores,
// prato do tempo, arco de velocidade e pétalas (Tinta, Ferramenta).
// Não recebe eventos sozinha: o input.js pergunta "é seu?" (down) e repassa move/up.
// Especificação: docs/10-plano-ate-v1.md, seção "A roda de canto". Textos: docs/11.

import { INKS, PAPERS, DOC_W, WHEEL_STEP_DEG, HISTORY_MODE_MS } from '../config.js';

const MARGIN = 16;
const BTN_R = 32;                         // botão recolhido: 64 px
const R_CENTER = 36, R_SECT = 80, R_PLATE = 120;
const R_SPEED0 = 126, R_SPEED1 = 174;     // arco de velocidade: 48 px de espessura
const SPEED_SPAN = 60;                    // graus
const PETAL_R = 206, PILL_R = 26;         // pastilhas de 52 px
const PETAL_STEP = 17;                    // graus entre pastilhas
const COLOR_R = 270, COLOR_PILL_R = 22;   // arco das 8 cores da tinta ativa (pétala Tinta), pastilhas de 44 px
const COLOR_STEP = 14;
const SIZE_R0 = 240, SIZE_R1 = 288;       // arco de tamanho (pétala Ferramenta)
const BRUSH_MIN = 2, BRUSH_MAX = 40;
const ANIM_MS = 150;
const READ_MS = 1500;
const LONG_MS = 500;                      // toque longo numa tinta
const DRAG_MS = 400;                      // segurar o botão para mover de canto
const TAP_MOVE = 20;
const RAD = Math.PI / 180;

// Direção "para dentro da tela" de cada canto (graus, eixo y para baixo).
const BASE = { bl: -45, br: -135, tl: 45, tr: 135 };

// Setores do anel do meio, como no desenho do doc 10 (Des | Ref / Tin ( ) Fer / Cam | Mais).
const SECTORS = [
  { id: 'undo', label: 'Desfazer', a: -120 },
  { id: 'redo', label: 'Refazer', a: -60 },
  { id: 'tool', label: 'Ferramenta', a: 0 },
  { id: 'more', label: 'Menu', a: 60 },
  { id: 'layers', label: 'Tempo', a: 120 },
  { id: 'ink', label: 'Tinta', a: 180 },
];

const TOOLS = [['brush', 'Pincel'], ['eraser', 'Borracha'], ['lasso', 'Laço']];

const C = {
  panel: '#252320', plate: '#2e2b27', hub: '#1f1d1a', line: '#3a3732', hi: '#3a3631',
  text: '#e9e4d8', muted: '#9a9384', accent: '#ff48b0', bg: '#1b1a18',
};

function angDiff(a, b) { let d = a - b; while (d > 180) d -= 360; while (d < -180) d += 360; return d; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function setupWheel(app, canvas) {
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, dpr = 1;

  let open = false;
  let animT0 = -1e9;          // início da animação de abrir/fechar
  let petal = null;           // null | 'ink' | 'inkcolor' | 'tool'
  let petalLayer = 0;         // camada cuja cor está sendo trocada
  let plateHeld = false;
  let sizePreview = false;
  let dragPos = null;         // botão sendo arrastado para outro canto
  let hover = '';             // pastilha sob o dedo durante um arraste (destaque)
  let hadSelection = false;
  let showHint = false;       // dica "2 dedos: girar e escalar" junto dos chips (só nas primeiras seleções)
  let readText = '', readUntil = 0;
  let lastSpeedTap = 0;
  let lastSig = '';
  const active = new Map();   // pointerId -> gesto

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    lastSig = '';
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // ---------- geometria ----------
  const settings = () => app.project.settings;
  const corner = () => settings().wheelCorner || (settings().lefty ? 'br' : 'bl');
  function anchor(c, off) {
    return { x: c[1] === 'l' ? off : W - off, y: c[0] === 't' ? off : H - off };
  }
  const btnCenter = () => anchor(corner(), MARGIN + BTN_R);
  const wheelCenter = () => anchor(corner(), MARGIN + R_PLATE);
  function local(e) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  function polar(p, c) {
    const dx = p.x - c.x, dy = p.y - c.y;
    return { d: Math.hypot(dx, dy), a: Math.atan2(dy, dx) / RAD };
  }
  const docScale = () => W / DOC_W;   // unidades do documento -> px de tela

  // Arco de pastilhas centrado na direção do canto.
  function placeArc(items, radius, stepDeg, pillR) {
    const c = wheelCenter(), base = BASE[corner()];
    const start = base - (stepDeg * (items.length - 1)) / 2;
    items.forEach((it, k) => {
      const a = (start + stepDeg * k) * RAD;
      it.x = c.x + Math.cos(a) * radius;
      it.y = c.y + Math.sin(a) * radius;
      it.r = pillR;
    });
    return items;
  }

  function petalItems() {
    let items = [];
    const p = app.project;
    if (petal === 'ink') {
      // as 4 tintas do projeto (perto) e as 8 cores possíveis para a tinta ativa (fora): tudo à vista
      const inks = p.layers.map((L, i) => ({ kind: 'ink', i, color: INKS[L.ink].hex, on: i === p.activeLayer }));
      const cur = p.layers[p.activeLayer].ink;
      const colors = INKS.map((k, j) => ({
        kind: 'color', j, color: k.hex, on: j === cur,
        used: j !== cur && p.layers.some((L) => L.ink === j),
      }));
      return placeArc(inks, PETAL_R, PETAL_STEP, PILL_R).concat(placeArc(colors, COLOR_R, COLOR_STEP, COLOR_PILL_R));
    } else if (petal === 'inkcolor') {
      const cur = p.layers[petalLayer].ink;
      items = INKS.map((k, j) => ({ kind: 'inkcolor', j, color: k.hex, on: j === cur }));
    } else if (petal === 'tool') {
      items = TOOLS.map(([t, label]) => ({ kind: 'tool', tool: t, label, on: app.tool === t }));
    }
    return placeArc(items, PETAL_R, PETAL_STEP, PILL_R);
  }

  function sectorAt(a) {
    let best = SECTORS[0], bd = 999;
    for (const s of SECTORS) { const d = Math.abs(angDiff(a, s.a)); if (d < bd) { bd = d; best = s; } }
    return best;
  }

  function chipRects() {
    const b = app.input?.selectionBounds();
    if (!b) return null;
    const k = docScale();
    const box = { x0: b.x0 * k, y0: b.y0 * k, x1: b.x1 * k, y1: b.y1 * k };
    const h = 48, w1 = 124, w2 = 96, gap = 8;
    let y = box.y1 + 10;
    if (y + h > H - 8) y = box.y0 - 10 - h;
    y = clamp(y, 8, H - h - 8);
    const x = clamp(box.x0, 8, W - (w1 + gap + w2) - 8);
    return { box, dup: { x, y, w: w1, h }, del: { x: x + w1 + gap, y, w: w2, h } };
  }
  const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

  function hit(p) {
    const chips = chipRects();
    if (chips) {
      if (inRect(p, chips.dup)) return { kind: 'chip', id: 'dup' };
      if (inRect(p, chips.del)) return { kind: 'chip', id: 'del' };
    }
    if (!open) {
      const b = btnCenter();
      return Math.hypot(p.x - b.x, p.y - b.y) <= BTN_R + 10 ? { kind: 'btn' } : null;
    }
    const c = wheelCenter(), base = BASE[corner()];
    const { d, a } = polar(p, c);
    if (petal) {
      for (const it of petalItems()) {
        if (Math.hypot(p.x - it.x, p.y - it.y) <= it.r + 4) return { kind: 'pill', item: it };
      }
      if (petal === 'tool' && d >= SIZE_R0 - 4 && d <= SIZE_R1 + 4 && Math.abs(angDiff(a, base)) <= SPEED_SPAN / 2 + 4) {
        return { kind: 'size' };
      }
    }
    if (d <= R_CENTER) return { kind: 'center' };
    if (d <= R_SECT) return { kind: 'sector', sector: sectorAt(a) };
    if (d <= R_PLATE + 4) return { kind: 'plate' };
    if (d >= R_SPEED0 - 4 && d <= R_SPEED1 + 4 && Math.abs(angDiff(a, base)) <= SPEED_SPAN / 2 + 4) return { kind: 'speed' };
    return null;
  }

  // ---------- ações ----------
  function say(text) { readText = text; readUntil = performance.now() + READ_MS; }

  function openWheel() { if (!open) { open = true; animT0 = performance.now(); } }
  function collapse() {
    petal = null;
    if (open) { open = false; animT0 = performance.now(); }
  }

  function fmtSpeed(v) {
    const s = Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',');
    return `${s}×`;
  }
  function speedFromPoint(p) {
    const { a } = polar(p, wheelCenter());
    const t = clamp((angDiff(a, BASE[corner()]) + SPEED_SPAN / 2) / SPEED_SPAN, 0, 1);
    let v = -2 + 4 * t;
    if (Math.abs(v - 1) < 0.12) v = 1;
    if (Math.abs(v) < 0.08) v = 0;
    v = Math.round(v * 10) / 10;
    app.clock.speed = v;
    say(fmtSpeed(v));
  }
  function sizeFromPoint(p) {
    const { a } = polar(p, wheelCenter());
    const t = clamp((angDiff(a, BASE[corner()]) + SPEED_SPAN / 2) / SPEED_SPAN, 0, 1);
    settings().brush = Math.round(BRUSH_MIN + t * (BRUSH_MAX - BRUSH_MIN));
    say(`${settings().brush}`);
  }

  function stepPlate(dir) {
    const now = performance.now();
    if (now < app.historyUntil) {
      if (dir > 0) app.redo(); else app.undo();
      app.historyUntil = now + HISTORY_MODE_MS;
      say('Histórico');
    } else {
      const layer = app.project.layers[app.project.activeLayer];
      app.clock.step(layer, dir);
      say(`${app.clock.frameOf(layer) + 1}/${layer.frames.length}`);
    }
  }

  function runSector(id, sheetWas) {
    if (id === 'undo') {
      if (app.undo()) app.historyUntil = performance.now() + HISTORY_MODE_MS;
    } else if (id === 'redo') {
      app.redo();
    } else if (id === 'ink' || id === 'tool') {
      petal = petal === id ? null : id;
    } else if (id === 'more' || id === 'layers') {
      petal = null;
      if (sheetWas === id) app.sheet.close(); else app.sheet.open(id);
    }
  }

  function runPill(it) {
    const p = app.project;
    if (it.kind === 'ink') {
      p.activeLayer = it.i;
      app.selection = null;
      app.onSelectionChange?.();
      petal = null;
      say(INKS[p.layers[it.i].ink].name.split(' ')[0]);
    } else if (it.kind === 'inkcolor') {
      p.layers[petalLayer].ink = it.j;
      petal = null;
    } else if (it.kind === 'color') {
      p.layers[p.activeLayer].ink = it.j;     // a pétala fica aberta para ver o resultado e trocar de novo
      say(INKS[it.j].name);
    } else if (it.kind === 'tool') {
      app.tool = it.tool;
      petal = null;
      say(it.label);
    }
    app.requestSave();
  }

  // ---------- eventos (repassados pelo input.js) ----------
  function down(e) {
    const p = local(e);
    const h = hit(p);
    if (!h) return false;
    const now = performance.now();
    const g = { ...h, x0: p.x, y0: p.y, moved: 0, sheetWas: app.sheet?.mode ?? null };
    if (h.kind !== 'sector') app.sheet?.close();

    if (h.kind === 'plate') {
      app.clock.holds.add('wheel');
      plateHeld = true;
      g.angle = polar(p, wheelCenter()).a;
      g.acc = 0;
    } else if (h.kind === 'speed') {
      if (now - lastSpeedTap < 300) { app.clock.speed = 1; say('1×'); g.done = true; }
      else speedFromPoint(p);
      lastSpeedTap = now;
    } else if (h.kind === 'size') {
      sizePreview = true;
      sizeFromPoint(p);
    } else if (h.kind === 'btn') {
      g.timer = setTimeout(() => { g.dragging = true; dragPos = p; }, DRAG_MS);
    } else if (h.kind === 'pill' && h.item.kind === 'ink') {
      g.timer = setTimeout(() => { g.long = true; petalLayer = h.item.i; petal = 'inkcolor'; }, LONG_MS);
    } else if (h.kind === 'sector' && (h.sector.id === 'ink' || h.sector.id === 'tool') && petal !== h.sector.id) {
      // abre a pétala já ao encostar: dá para arrastar até a pastilha e soltar em cima dela
      petal = h.sector.id;
      g.openedOnDown = true;
    }
    active.set(e.pointerId, g);
    return true;
  }

  function move(e) {
    const g = active.get(e.pointerId);
    if (!g) return;
    const p = local(e);
    g.moved = Math.max(g.moved, Math.hypot(p.x - g.x0, p.y - g.y0));
    if (g.kind === 'plate') {
      const a = polar(p, wheelCenter()).a;
      g.acc += angDiff(a, g.angle);
      g.angle = a;
      while (g.acc >= WHEEL_STEP_DEG) { g.acc -= WHEEL_STEP_DEG; stepPlate(1); }
      while (g.acc <= -WHEEL_STEP_DEG) { g.acc += WHEEL_STEP_DEG; stepPlate(-1); }
    } else if (g.kind === 'speed') {
      if (!g.done) speedFromPoint(p);
    } else if (g.kind === 'size') {
      sizeFromPoint(p);
    } else if (g.kind === 'btn') {
      if (g.dragging) dragPos = p;
      else if (g.moved > 10) { clearTimeout(g.timer); g.cancel = true; }
    } else if (g.kind === 'pill' && g.moved > 12) {
      clearTimeout(g.timer);
    }
    if (g.kind === 'pill' || g.kind === 'sector') {
      const h = petal && g.moved >= TAP_MOVE ? hit(p) : null;
      hover = h?.kind === 'pill' ? pillKey(h.item) : '';
    }
  }

  const pillKey = (it) => `${it.kind}:${it.i ?? it.j ?? it.tool}`;

  function up(e, cancelled) {
    const g = active.get(e.pointerId);
    if (!g) return;
    active.delete(e.pointerId);
    clearTimeout(g.timer);
    hover = '';
    const tap = !cancelled && g.moved < TAP_MOVE;

    // Arrastar e soltar sobre uma pastilha escolhe (Tinta/Ferramenta, ou a cor depois do toque longo).
    if (!cancelled && !tap && (g.kind === 'pill' || g.kind === 'sector') && petal) {
      const h = hit(local(e));
      if (h?.kind === 'pill') { runPill(h.item); return; }
    }

    if (g.kind === 'plate') {
      app.clock.holds.delete('wheel');
      plateHeld = false;
    } else if (g.kind === 'size') {
      sizePreview = false;
      app.requestSave();
    } else if (g.kind === 'btn') {
      if (g.dragging) {
        settings().wheelCorner = nearestCorner(dragPos);
        dragPos = null;
        app.requestSave();
      } else if (tap && !g.cancel) {
        openWheel();
      }
    } else if (tap) {
      if (g.kind === 'center') {
        app.clock.paused = !app.clock.paused;
        say(app.clock.paused ? 'Parado' : 'Tocando');
      } else if (g.kind === 'sector') {
        if (!g.openedOnDown) runSector(g.sector.id, g.sheetWas);
      } else if (g.kind === 'pill' && !g.long) {
        runPill(g.item);
      } else if (g.kind === 'chip') {
        if (g.id === 'dup') app.duplicateSelectionToNextFrame();
        else app.deleteSelection();
      }
    }
  }

  function nearestCorner(p) {
    const v = p.y < H / 2 ? 't' : 'b';
    const h = p.x < W / 2 ? 'l' : 'r';
    return v + h;
  }

  // O papel foi tocado (caneta ou dedo fora da roda): fecha pétalas e folha; recolhe se não estiver fixada.
  function paperDown() {
    petal = null;
    app.sheet?.close();
    if (open && !settings().pinWheel) collapse();
  }

  // ---------- desenho ----------
  function ring(c, r0, r1, a0, a1) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, r1, a0 * RAD, a1 * RAD);
    ctx.arc(c.x, c.y, r0, a1 * RAD, a0 * RAD, true);
    ctx.closePath();
  }
  function disc(x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  function text(t, x, y, size, color, weight = 600) {
    ctx.font = `${weight} ${size}px system-ui, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t, x, y);
  }
  // Quebra a leitura em até 2 linhas para caber no centro.
  function wrapped(t, x, y, maxW, size, color) {
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    if (ctx.measureText(t).width <= maxW) { text(t, x, y, size, color); return; }
    const words = t.split(' ');
    let a = words.shift(), rest = words;
    while (rest.length && ctx.measureText(a + ' ' + rest[0]).width <= maxW) a += ' ' + rest.shift();
    text(a, x, y - size * 0.6, size, color);
    text(rest.join(' '), x, y + size * 0.6, size, color);
  }

  function frameInfo() {
    const layer = app.project.layers[app.project.activeLayer];
    return { layer, n: layer.frames.length, f: app.clock.frameOf(layer), ink: INKS[layer.ink].hex };
  }

  function drawButton(c) {
    const { n, f, ink } = frameInfo();
    disc(c.x, c.y, BTN_R);
    ctx.fillStyle = 'rgba(27,26,24,0.92)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.line;
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      disc(c.x + Math.cos(a) * 23, c.y + Math.sin(a) * 23, i === f ? 3.5 : 2.2);
      ctx.fillStyle = i === f ? C.text : '#5a554c';
      ctx.fill();
    }
    // Miolo: a tinta ativa e a ferramenta (cheio = Pincel, vazado = Borracha, tracejado = Laço).
    disc(c.x, c.y, 13);
    if (app.tool === 'eraser' && !app.lassoHeld) {
      ctx.fillStyle = (PAPERS[app.project.paper] || PAPERS.natural).hex;
      ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = ink; ctx.stroke();
    } else {
      ctx.fillStyle = ink;
      ctx.fill();
    }
    if (app.tool === 'lasso' || app.lassoHeld) {
      disc(c.x, c.y, 17);
      ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5; ctx.strokeStyle = C.text; ctx.stroke(); ctx.setLineDash([]);
    }
    if (app.clock.paused) {           // traço fino quando parado
      disc(c.x, c.y, BTN_R - 3);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C.text;
      ctx.stroke();
    }
  }

  function drawWheel(c, s) {
    const base = BASE[corner()];
    const { n, f, ink } = frameInfo();
    const now = performance.now();
    const history = now < app.historyUntil;
    ctx.save();
    ctx.globalAlpha = clamp(s, 0, 1);
    ctx.translate(c.x, c.y); ctx.scale(s, s); ctx.translate(-c.x, -c.y);

    // arco de velocidade
    ring(c, R_SPEED0, R_SPEED1, base - SPEED_SPAN / 2, base + SPEED_SPAN / 2);
    ctx.fillStyle = 'rgba(37,35,32,0.94)'; ctx.fill();
    ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.stroke();
    const spA = (v) => (base - SPEED_SPAN / 2 + ((v + 2) / 4) * SPEED_SPAN) * RAD;
    for (const [v, label] of [[-2, '−2'], [0, '0'], [1, '1'], [2, '2']]) {
      const a = spA(v);
      ctx.beginPath();
      ctx.moveTo(c.x + Math.cos(a) * R_SPEED0, c.y + Math.sin(a) * R_SPEED0);
      ctx.lineTo(c.x + Math.cos(a) * (R_SPEED0 + 8), c.y + Math.sin(a) * (R_SPEED0 + 8));
      ctx.strokeStyle = C.muted; ctx.stroke();
      text(label, c.x + Math.cos(a) * (R_SPEED1 - 10), c.y + Math.sin(a) * (R_SPEED1 - 10), 10, C.muted);
    }
    const sa = spA(clamp(app.clock.speed, -2, 2));
    disc(c.x + Math.cos(sa) * ((R_SPEED0 + R_SPEED1) / 2 - 4), c.y + Math.sin(sa) * ((R_SPEED0 + R_SPEED1) / 2 - 4), 9);
    ctx.fillStyle = C.text; ctx.fill();

    // prato
    ring(c, R_SECT, R_PLATE, 0, 360);
    ctx.fillStyle = C.plate; ctx.fill();
    ctx.lineWidth = history ? 3 : plateHeld ? 2 : 1;
    ctx.strokeStyle = history ? C.accent : plateHeld ? C.text : C.line;
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      disc(c.x + Math.cos(a) * 100, c.y + Math.sin(a) * 100, i === f ? 6 : 4);
      ctx.fillStyle = i === f ? C.text : '#4a463f';
      ctx.fill();
    }

    // setores
    for (const sec of SECTORS) {
      ring(c, R_CENTER, R_SECT, sec.a - 30, sec.a + 30);
      const on = petal === sec.id || (petal === 'inkcolor' && sec.id === 'ink') || app.sheet?.mode === sec.id;
      ctx.fillStyle = on ? C.hi : C.panel; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.stroke();
      const off = (sec.id === 'undo' && !app.history.canUndo) || (sec.id === 'redo' && !app.history.canRedo);
      ctx.globalAlpha = clamp(s, 0, 1) * (off ? 0.5 : 1);
      const a = sec.a * RAD;
      const lx = c.x + Math.cos(a) * 58, ly = c.y + Math.sin(a) * 58;
      if (sec.id === 'ink') { disc(lx, ly - 7, 6); ctx.fillStyle = ink; ctx.fill(); text(sec.label, lx, ly + 7, 10, C.text); }
      else text(sec.label, lx, ly, sec.label.length > 8 ? 9 : 10, C.text);
      ctx.globalAlpha = clamp(s, 0, 1);
    }

    // centro
    disc(c.x, c.y, R_CENTER);
    ctx.fillStyle = C.hub; ctx.fill();
    ctx.strokeStyle = C.line; ctx.stroke();
    if (now < readUntil) wrapped(readText, c.x, c.y, 62, 11, C.text);
    else text(history ? '↺' : app.clock.paused ? '▶' : '❚❚', c.x, c.y + 1, 18, C.text, 400);

    if (petal) drawPetal(c, base);
    ctx.restore();
  }

  function drawPetal(c, base) {
    for (const it of petalItems()) {
      if (hover === pillKey(it)) {          // destaque da pastilha sob o dedo
        disc(it.x, it.y, it.r + 7);
        ctx.lineWidth = 3; ctx.strokeStyle = C.text; ctx.stroke();
      }
      disc(it.x, it.y, it.r);
      if (it.color) {
        ctx.fillStyle = it.color; ctx.fill();
        ctx.lineWidth = it.on ? 4 : 1.5; ctx.strokeStyle = it.on ? C.text : C.bg; ctx.stroke();
        if (it.used) {                      // cor já usada por outra tinta do projeto
          disc(it.x, it.y, 4); ctx.fillStyle = C.bg; ctx.fill();
        }
      } else {
        ctx.fillStyle = it.on ? C.text : C.plate; ctx.fill();
        ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.stroke();
        text(it.label, it.x, it.y, 10, it.on ? C.bg : C.text);
      }
    }
    if (petal === 'ink') {
      const a0 = (base - (COLOR_STEP * (INKS.length - 1)) / 2) * RAD;
      const a1 = (base - (PETAL_STEP * 3) / 2 - PETAL_STEP) * RAD;   // logo antes da 1ª tinta
      label('Cor da tinta', c.x + Math.cos(a0) * (COLOR_R + 36), c.y + Math.sin(a0) * (COLOR_R + 36));
      label('Tintas', c.x + Math.cos(a1) * PETAL_R, c.y + Math.sin(a1) * PETAL_R);
    }
    if (petal === 'tool') {
      ring(c, SIZE_R0, SIZE_R1, base - SPEED_SPAN / 2, base + SPEED_SPAN / 2);
      ctx.fillStyle = 'rgba(37,35,32,0.94)'; ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = C.line; ctx.stroke();
      const b = settings().brush;
      const a = (base - SPEED_SPAN / 2 + ((b - BRUSH_MIN) / (BRUSH_MAX - BRUSH_MIN)) * SPEED_SPAN) * RAD;
      const r = (SIZE_R0 + SIZE_R1) / 2;
      disc(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 13);
      ctx.fillStyle = C.text; ctx.fill();
      text(String(b), c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 10, C.bg);
      const a0 = (base - SPEED_SPAN / 2) * RAD;
      text('Tamanho', c.x + Math.cos(a0) * (SIZE_R1 + 14), c.y + Math.sin(a0) * (SIZE_R1 + 14), 10, C.muted);
    }
  }

  // Rótulo pequeno com fundo, legível sobre qualquer papel ou tinta.
  function label(t, x, y) {
    ctx.font = '600 11px system-ui, sans-serif';
    const w = ctx.measureText(t).width + 12;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 10, w, 20, 10);
    ctx.fillStyle = 'rgba(27,26,24,0.85)'; ctx.fill();
    text(t, x, y, 11, C.muted);
  }

  function drawSelection() {
    const chips = chipRects();
    if (!chips) return;
    const { box } = chips;
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#222';
    ctx.strokeRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
    ctx.restore();
    for (const [r, t] of [[chips.dup, 'Duplicar →'], [chips.del, 'Apagar']]) {
      ctx.beginPath();
      ctx.roundRect(r.x, r.y, r.w, r.h, 10);
      ctx.fillStyle = 'rgba(27,26,24,0.92)'; ctx.fill();
      text(t, r.x + r.w / 2, r.y + r.h / 2, 14, C.text, 500);
    }
    if (showHint) {
      const t = '2 dedos sobre a seleção: girar e escalar';
      ctx.font = '600 11px system-ui, sans-serif';
      const w = ctx.measureText(t).width + 12;
      const x = clamp(chips.dup.x + w / 2, w / 2 + 8, W - w / 2 - 8);
      const below = chips.dup.y + chips.dup.h + 16;
      label(t, x, below + 10 > H ? chips.dup.y - 16 : below);
    }
  }

  function drawSizePreview() {
    const r = (settings().brush * docScale()) / 2;
    disc(W / 2, H / 2, Math.max(1, r));
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#222';
    ctx.stroke();
  }

  function drawReadoutNearButton(c) {
    const dir = BASE[corner()] * RAD;
    const x = c.x + Math.cos(dir) * 70, y = c.y + Math.sin(dir) * 70;
    ctx.font = '600 13px system-ui, sans-serif';
    const w = ctx.measureText(readText).width + 20;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 15, w, 30, 15);
    ctx.fillStyle = 'rgba(27,26,24,0.92)'; ctx.fill();
    text(readText, x, y, 13, C.text);
  }

  // Dica de 2 dedos: aparece nas 5 primeiras seleções deste aparelho.
  const HINT_KEY = 'grao.dica2dedos', HINT_TIMES = 5;
  function hintCount() { try { return +localStorage.getItem(HINT_KEY) || 0; } catch { return HINT_TIMES; } }
  function noteSelection(has) {
    if (has && !hadSelection) {
      const n = hintCount();
      showHint = n < HINT_TIMES;
      if (showHint) { try { localStorage.setItem(HINT_KEY, String(n + 1)); } catch { /* sem armazenamento */ } }
    }
    if (!has) showHint = false;
    hadSelection = has;
  }

  // Redesenha só quando algo visível mudou (o canvas cobre a tela inteira).
  function update() {
    const now = performance.now();
    const k = (now - animT0) / ANIM_MS;
    const animating = k < 1;
    const { n, f, ink } = frameInfo();
    const sb = app.input?.selectionBounds();
    noteSelection(!!sb);
    const sig = [
      W, H, open, petal, petalLayer, corner(), n, f, ink, app.clock.paused, app.clock.speed, plateHeld,
      now < app.historyUntil, now < readUntil ? readText : '', app.tool, settings().brush, sizePreview,
      dragPos && `${dragPos.x | 0},${dragPos.y | 0}`, app.sheet?.mode, app.history.canUndo, app.history.canRedo,
      sb && `${sb.x0 | 0},${sb.y0 | 0},${sb.x1 | 0},${sb.y1 | 0}`,
      app.project.layers.map((L) => L.ink).join(','), hover, app.lassoHeld, app.project.paper, showHint,
    ].join('|');
    if (!animating && sig === lastSig) return;
    lastSig = animating ? '' : sig;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawSelection();
    if (sizePreview) drawSizePreview();

    const s = open ? clamp(k, 0, 1) : 1 - clamp(k, 0, 1);
    const ease = 1 - (1 - s) * (1 - s);
    if (open || animating) {
      const scaleFrom = BTN_R / R_PLATE;
      drawWheel(wheelCenter(), scaleFrom + (1 - scaleFrom) * ease);
    }
    if (!open) {
      const c = dragPos || btnCenter();
      if (dragPos) {
        for (const cn of ['bl', 'br', 'tl', 'tr']) {
          const a = anchor(cn, MARGIN + BTN_R);
          disc(a.x, a.y, BTN_R); ctx.setLineDash([4, 4]); ctx.strokeStyle = C.muted; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash([]);
        }
      }
      if (!animating || dragPos) drawButton(c);
      if (now < readUntil && !dragPos) drawReadoutNearButton(c);
    }

    // o painel de teste fica no canto oposto à roda
    const box = app.debug?.box;
    if (box) box.dataset.corner = { bl: 'tr', br: 'tl', tl: 'br', tr: 'bl' }[corner()];
  }

  function rebuild() { collapse(); lastSig = ''; }

  return {
    down, move, up, paperDown, update, rebuild, collapse, say,
    get corner() { return corner(); },
    get isOpen() { return open; },
    get petal() { return petal; },
  };
}
