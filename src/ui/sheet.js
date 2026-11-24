// Folhas compactas perto da roda (HTML): "Mais" (ajustes) e "Camadas" (FPS e frames da camada ativa).
// Só existem com a caneta parada: fecham quando o papel ou a roda são tocados (ver wheel.paperDown).

import { INKS, PAPERS, FPS_OPTIONS, MAX_FRAMES } from '../config.js';

export function setupSheet(app) {
  const el = document.createElement('div');
  el.className = 'sheet';
  el.hidden = true;
  el.setAttribute('role', 'dialog');
  document.body.appendChild(el);
  let mode = null;

  function position() {
    const c = app.ui?.corner || 'bl';
    const side = 16 + 240 + 12;   // ao lado da roda aberta
    el.style.left = c[1] === 'l' ? `${side}px` : '';
    el.style.right = c[1] === 'r' ? `${side}px` : '';
    el.style.top = c[0] === 't' ? '16px' : '';
    el.style.bottom = c[0] === 'b' ? '16px' : '';
  }

  function buildMore() {
    const s = app.project.settings;
    el.setAttribute('aria-label', 'Mais');
    el.innerHTML = `
      <label>Grão <input type="range" data-k="grain" min="0" max="1" step="0.01"></label>
      <label>Desalinhamento <input type="range" data-k="mis" min="0" max="1" step="0.01"></label>
      <label class="check"><input type="checkbox" data-k="ferver"> Ferver</label>
      <label>Papel <select data-k="paper"></select></label>
      <label class="check"><input type="checkbox" data-k="auto"> Auto</label>
      <label class="check"><input type="checkbox" data-k="pinWheel"> Fixar roda</label>
      <label class="check"><input type="checkbox" data-k="lefty"> Canhoto</label>
      <label class="check"><input type="checkbox" data-k="debug"> Teste da Fase 0</label>
      <div class="row">
        <button class="btn small" data-act="png">Exportar PNG</button>
        <button class="btn small" data-act="new">Novo projeto</button>
      </div>
      <div class="version">Grão ${app.version}</div>`;
    const q = (k) => el.querySelector(`[data-k="${k}"]`);
    const paper = q('paper');
    for (const [k, p] of Object.entries(PAPERS)) paper.add(new Option(p.name, k));
    paper.value = app.project.paper;
    q('grain').value = s.grain;
    q('mis').value = s.mis;
    for (const k of ['ferver', 'auto', 'pinWheel', 'lefty']) q(k).checked = !!s[k];
    q('debug').checked = !!app.debug?.visible;

    q('grain').oninput = (e) => { s.grain = +e.target.value; app.requestSave(); };
    q('mis').oninput = (e) => { s.mis = +e.target.value; app.requestSave(); };
    for (const k of ['ferver', 'auto', 'pinWheel']) q(k).onchange = (e) => { s[k] = e.target.checked; app.requestSave(); };
    q('lefty').onchange = (e) => { s.lefty = e.target.checked; app.requestSave(); position(); };
    paper.onchange = () => { app.project.paper = paper.value; app.requestSave(); };
    q('debug').onchange = (e) => app.debug.setVisible(e.target.checked);
    el.querySelector('[data-act="png"]').onclick = () => app.exportPNG();
    el.querySelector('[data-act="new"]').onclick = () => {
      if (confirm('Começar um projeto novo? O desenho atual será apagado deste aparelho.')) { close(); app.newProject(); }
    };
  }

  function buildLayers() {
    const i = app.project.activeLayer;
    const layer = app.project.layers[i];
    el.setAttribute('aria-label', 'Camadas');
    el.innerHTML = `
      <div class="lp-title">Camada ${i + 1} · ${INKS[layer.ink].name}</div>
      <div class="lp-row"><span>FPS</span><div class="lp-fps"></div></div>
      <div class="lp-row"><span>Frames</span>
        <button class="btn small" data-act="frames-" aria-label="Remover frame">−</button>
        <b class="lp-count">${layer.frames.length}</b>
        <button class="btn small" data-act="frames+" aria-label="Adicionar frame">+</button>
      </div>`;
    const fps = el.querySelector('.lp-fps');
    FPS_OPTIONS.forEach((v) => {
      const b = document.createElement('button');
      b.className = 'btn small' + (v === layer.fps ? ' on' : '');
      b.textContent = v;
      b.onclick = () => { layer.fps = v; app.requestSave(); buildLayers(); };
      fps.appendChild(b);
    });
    el.querySelector('[data-act="frames+"]').onclick = () => {
      if (layer.frames.length >= MAX_FRAMES) { app.toast('Máximo de 12 frames por camada.'); return; }
      layer.frames.push([]);
      app.selection = null; app.onSelectionChange?.();
      app.requestSave(); buildLayers();
    };
    el.querySelector('[data-act="frames-"]').onclick = () => {
      if (layer.frames.length <= 1) return;
      if (layer.frames[layer.frames.length - 1].length) { app.toast('Esse frame tem desenho. Apague antes de remover.'); return; }
      layer.frames.pop();
      app.masks.drop(i, layer.frames.length);
      app.selection = null; app.onSelectionChange?.();
      app.requestSave(); buildLayers();
    };
  }

  function open(m) {
    mode = m;
    if (m === 'more') buildMore(); else buildLayers();
    position();
    el.hidden = false;
  }

  function close() {
    if (!mode) return;
    mode = null;
    el.hidden = true;
    el.innerHTML = '';
  }

  return { open, close, get mode() { return mode; } };
}
