// Zona do polegar: tintas, Laço (segurar), Desfazer, roda de tempo (prato), fader de velocidade,
// leituras e ajustes. Fica ao lado do canvas, nunca por cima (exigência do canvas de baixa latência).

import { INKS, PAPERS, FPS_OPTIONS, MAX_FRAMES, WHEEL_STEP_DEG, HISTORY_MODE_MS } from '../config.js';

// Captura o ponteiro; ignora a falha quando o ponteiro já sumiu (eventos sintéticos, cancelamentos).
function capture(el, e) { try { el.setPointerCapture(e.pointerId); } catch { /* sem captura */ } }

const LONG_PRESS_MS = 500;
const SVG = 'http://www.w3.org/2000/svg';

export function setupThumbZone(app, root) {
  root.innerHTML = `
    <div class="inks" role="group" aria-label="Tintas"></div>
    <div class="layer-panel" hidden>
      <div class="lp-title"></div>
      <div class="lp-row lp-swatches"></div>
      <div class="lp-row"><span>FPS</span><div class="lp-fps"></div></div>
      <div class="lp-row"><span>Frames</span>
        <button class="btn small" data-act="frames-">−</button><b class="lp-count"></b><button class="btn small" data-act="frames+">+</button>
      </div>
      <button class="btn small" data-act="close-panel">Fechar</button>
    </div>
    <button class="btn key" id="lasso" aria-label="Laço: segure e desenhe em volta">Laço</button>
    <div class="row">
      <button class="btn" id="undo">Desfazer</button>
      <button class="btn toggle" id="cut" aria-pressed="false">Recorte</button>
    </div>
    <div class="row selection-actions" hidden>
      <button class="btn small" id="dup">Duplicar →</button>
      <button class="btn small" id="del">Apagar</button>
    </div>
    <div class="time">
      <div class="wheel" id="wheel" aria-label="Roda de tempo"><svg viewBox="0 0 160 160"></svg></div>
      <input class="fader" id="fader" type="range" min="-2" max="2" step="0.05" value="1" aria-label="Velocidade">
    </div>
    <div class="readout" id="readout" aria-live="off"></div>
    <div class="row">
      <button class="btn toggle" id="auto" aria-pressed="true">Auto</button>
      <button class="btn" id="more" aria-expanded="false">Ajustes</button>
    </div>
    <div class="settings" hidden>
      <label>Grão <input type="range" id="grain" min="0" max="1" step="0.01"></label>
      <label>Desalinhamento <input type="range" id="mis" min="0" max="1" step="0.01"></label>
      <label>Pincel <input type="range" id="brush" min="2" max="40" step="1"></label>
      <label class="check"><input type="checkbox" id="ferver"> Ferver</label>
      <label>Papel <select id="paper"></select></label>
      <label class="check"><input type="checkbox" id="lefty"> Canhoto</label>
      <label class="check"><input type="checkbox" id="debug"> Teste da Fase 0</label>
      <div class="row">
        <button class="btn small" id="png">Exportar PNG</button>
        <button class="btn small" id="new">Novo projeto</button>
      </div>
      <div class="version"></div>
    </div>
    <pre class="debug" id="debugbox" hidden></pre>
  `;

  const $ = (sel) => root.querySelector(sel);
  const inksEl = $('.inks');
  const panel = $('.layer-panel');
  const svg = $('#wheel svg');
  const wheel = $('#wheel');
  const fader = $('#fader');
  const readout = $('#readout');
  let panelLayer = -1;

  // ---------- tintas ----------
  function buildInks() {
    inksEl.innerHTML = '';
    app.project.layers.forEach((layer, i) => {
      const b = document.createElement('button');
      b.className = 'ink';
      b.style.setProperty('--ink', INKS[layer.ink].hex);
      b.setAttribute('aria-label', INKS[layer.ink].name);
      b.title = INKS[layer.ink].name;
      let timer = null, long = false;
      b.addEventListener('pointerdown', () => {
        long = false;
        timer = setTimeout(() => { long = true; openPanel(i); }, LONG_PRESS_MS);
      });
      const cancel = () => clearTimeout(timer);
      b.addEventListener('pointerup', () => {
        cancel();
        if (!long) { app.project.activeLayer = i; app.selection = null; app.onSelectionChange?.(); app.requestSave(); }
      });
      b.addEventListener('pointerleave', cancel);
      b.addEventListener('pointercancel', cancel);
      inksEl.appendChild(b);
    });
  }

  function openPanel(i) {
    panelLayer = i;
    const layer = app.project.layers[i];
    panel.hidden = false;
    panel.querySelector('.lp-title').textContent = `Camada ${i + 1} · ${INKS[layer.ink].name}`;
    const sw = panel.querySelector('.lp-swatches');
    sw.innerHTML = '';
    INKS.forEach((ink, j) => {
      const s = document.createElement('button');
      s.className = 'swatch' + (j === layer.ink ? ' on' : '');
      s.style.setProperty('--ink', ink.hex);
      s.title = ink.name;
      s.addEventListener('click', () => { layer.ink = j; buildInks(); openPanel(i); app.requestSave(); });
      sw.appendChild(s);
    });
    const fps = panel.querySelector('.lp-fps');
    fps.innerHTML = '';
    FPS_OPTIONS.forEach((v) => {
      const s = document.createElement('button');
      s.className = 'btn small' + (v === layer.fps ? ' on' : '');
      s.textContent = v;
      s.addEventListener('click', () => { layer.fps = v; openPanel(i); app.requestSave(); });
      fps.appendChild(s);
    });
    panel.querySelector('.lp-count').textContent = layer.frames.length;
  }

  panel.addEventListener('click', (e) => {
    const act = e.target.dataset?.act;
    if (!act) return;
    const layer = app.project.layers[panelLayer];
    if (act === 'close-panel') { panel.hidden = true; return; }
    if (act === 'frames+' && layer.frames.length < MAX_FRAMES) layer.frames.push([]);
    if (act === 'frames-' && layer.frames.length > 1) {
      const last = layer.frames[layer.frames.length - 1];
      if (last.length) { app.toast('O último frame tem desenho; apague-o antes.'); return; }
      layer.frames.pop();
      app.masks.drop(panelLayer, layer.frames.length);
    }
    app.selection = null;
    app.requestSave();
    openPanel(panelLayer);
  });

  // ---------- laço (mola: congela enquanto segura) ----------
  const lassoBtn = $('#lasso');
  lassoBtn.addEventListener('pointerdown', (e) => {
    capture(lassoBtn, e);
    app.lassoHeld = true;
    app.clock.holds.add('lasso');
    lassoBtn.classList.add('held');
  });
  const lassoUp = () => { app.lassoHeld = false; app.clock.holds.delete('lasso'); lassoBtn.classList.remove('held'); };
  lassoBtn.addEventListener('pointerup', lassoUp);
  lassoBtn.addEventListener('pointercancel', lassoUp);

  // ---------- desfazer, recorte, seleção ----------
  $('#undo').addEventListener('click', () => { app.undo(); app.historyUntil = performance.now() + HISTORY_MODE_MS; });
  const cutBtn = $('#cut');
  cutBtn.addEventListener('click', () => { app.cutTool = !app.cutTool; cutBtn.setAttribute('aria-pressed', app.cutTool); });
  $('#dup').addEventListener('click', () => app.duplicateSelectionToNextFrame());
  $('#del').addEventListener('click', () => app.deleteSelection());

  // ---------- roda de tempo: encostar = segurar o disco ----------
  let grab = null, centerTap = null, lastDots = -1;
  function polar(e) {
    const r = wheel.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    return { dist: Math.hypot(dx, dy) / (r.width / 2), angle: (Math.atan2(dy, dx) * 180) / Math.PI };
  }
  function stepWheel(dir) {
    const now = performance.now();
    if (now < app.historyUntil) {
      if (dir > 0) app.redo(); else app.undo();
      app.historyUntil = now + HISTORY_MODE_MS;
    } else {
      app.clock.step(app.project.layers[app.project.activeLayer], dir);
    }
  }
  wheel.addEventListener('pointerdown', (e) => {
    capture(wheel, e);
    const p = polar(e);
    if (p.dist < 0.3) { centerTap = { x: e.clientX, y: e.clientY }; return; }
    app.clock.holds.add('wheel');
    grab = { angle: p.angle, acc: 0 };
    wheel.classList.add('held');
  });
  wheel.addEventListener('pointermove', (e) => {
    if (!grab) return;
    const a = polar(e).angle;
    let d = a - grab.angle;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    grab.angle = a;
    grab.acc += d;
    while (grab.acc >= WHEEL_STEP_DEG) { grab.acc -= WHEEL_STEP_DEG; stepWheel(1); }
    while (grab.acc <= -WHEEL_STEP_DEG) { grab.acc += WHEEL_STEP_DEG; stepWheel(-1); }
  });
  const wheelUp = (e) => {
    if (centerTap && Math.hypot(e.clientX - centerTap.x, e.clientY - centerTap.y) < 12) app.clock.paused = !app.clock.paused;
    centerTap = null;
    if (grab) { app.clock.holds.delete('wheel'); grab = null; wheel.classList.remove('held'); }
  };
  wheel.addEventListener('pointerup', wheelUp);
  wheel.addEventListener('pointercancel', wheelUp);

  function buildDots(n) {
    svg.innerHTML = '';
    const plate = document.createElementNS(SVG, 'circle');
    plate.setAttribute('cx', 80); plate.setAttribute('cy', 80); plate.setAttribute('r', 76);
    plate.setAttribute('class', 'plate');
    svg.appendChild(plate);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const c = document.createElementNS(SVG, 'circle');
      c.setAttribute('cx', 80 + Math.cos(a) * 56);
      c.setAttribute('cy', 80 + Math.sin(a) * 56);
      c.setAttribute('r', 5);
      c.setAttribute('class', 'dot');
      svg.appendChild(c);
    }
    const hub = document.createElementNS(SVG, 'circle');
    hub.setAttribute('cx', 80); hub.setAttribute('cy', 80); hub.setAttribute('r', 22);
    hub.setAttribute('class', 'hub');
    svg.appendChild(hub);
    const icon = document.createElementNS(SVG, 'text');
    icon.setAttribute('x', 80); icon.setAttribute('y', 87);
    icon.setAttribute('text-anchor', 'middle');
    icon.setAttribute('class', 'hub-icon');
    svg.appendChild(icon);
    lastDots = n;
  }

  // ---------- fader de velocidade ----------
  let lastTap = 0;
  fader.addEventListener('input', () => {
    let v = parseFloat(fader.value);
    if (Math.abs(v - 1) < 0.08) v = 1;
    if (Math.abs(v) < 0.04) v = 0;
    app.clock.speed = v;
  });
  fader.addEventListener('pointerdown', () => {
    const now = performance.now();
    if (now - lastTap < 300) { app.clock.speed = 1; fader.value = 1; }
    lastTap = now;
  });

  // ---------- ajustes ----------
  const settings = $('.settings');
  $('#more').addEventListener('click', (e) => {
    settings.hidden = !settings.hidden;
    e.target.setAttribute('aria-expanded', !settings.hidden);
  });
  const paperSel = $('#paper');
  for (const [k, p] of Object.entries(PAPERS)) paperSel.add(new Option(p.name, k));
  function syncSettings() {
    const s = app.project.settings;
    $('#grain').value = s.grain; $('#mis').value = s.mis; $('#brush').value = s.brush;
    $('#ferver').checked = s.ferver; $('#lefty').checked = s.lefty; paperSel.value = app.project.paper;
    $('#auto').setAttribute('aria-pressed', s.auto);
    document.body.classList.toggle('lefty', !!s.lefty);
  }
  $('#grain').addEventListener('input', (e) => { app.project.settings.grain = +e.target.value; app.requestSave(); });
  $('#mis').addEventListener('input', (e) => { app.project.settings.mis = +e.target.value; app.requestSave(); });
  $('#brush').addEventListener('input', (e) => { app.project.settings.brush = +e.target.value; app.requestSave(); });
  $('#ferver').addEventListener('change', (e) => { app.project.settings.ferver = e.target.checked; app.requestSave(); });
  $('#lefty').addEventListener('change', (e) => { app.project.settings.lefty = e.target.checked; syncSettings(); app.requestSave(); });
  paperSel.addEventListener('change', () => { app.project.paper = paperSel.value; app.requestSave(); });
  $('#auto').addEventListener('click', (e) => {
    app.project.settings.auto = !app.project.settings.auto;
    e.target.setAttribute('aria-pressed', app.project.settings.auto);
    app.requestSave();
  });
  $('#debug').addEventListener('change', (e) => app.debug.setVisible(e.target.checked));
  $('#png').addEventListener('click', () => app.exportPNG());
  $('#new').addEventListener('click', () => {
    if (confirm('Começar um projeto novo? O atual será apagado deste aparelho.')) app.newProject();
  });
  $('.version').textContent = `Grão v${app.version}`;

  // ---------- atualização por quadro ----------
  let lastText = '';
  function update() {
    const layer = app.project.layers[app.project.activeLayer];
    const n = layer.frames.length;
    if (n !== lastDots) buildDots(n);
    const f = app.clock.frameOf(layer);
    const dots = svg.querySelectorAll('.dot');
    dots.forEach((d, i) => d.classList.toggle('on', i === f));
    const history = performance.now() < app.historyUntil;
    wheel.classList.toggle('history', history);
    const icon = svg.querySelector('.hub-icon');
    const iconText = history ? '↺' : app.clock.paused ? '▶' : '❚❚';
    if (icon.textContent !== iconText) icon.textContent = iconText;

    [...inksEl.children].forEach((b, i) => b.classList.toggle('on', i === app.project.activeLayer));
    $('.selection-actions').hidden = !app.selection;

    const state = history ? `histórico (${app.history.depth})` : app.clock.frozen ? 'congelado' : 'tocando';
    const text = `${f + 1}/${n} · ${app.clock.speed.toFixed(1).replace('.', ',')}× · ${state}${app.project.settings.auto ? ' · auto' : ''}`;
    if (text !== lastText) { readout.textContent = text; lastText = text; }
  }

  function rebuild() { buildInks(); syncSettings(); panel.hidden = true; lastDots = -1; fader.value = app.clock.speed; }

  rebuild();
  return { update, rebuild, debugBox: $('#debugbox') };
}
