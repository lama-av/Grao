// Folhas compactas perto da roda (HTML): "Menu" (arquivo e ajustes), "Tempo" (FPS e frames da camada ativa),
// "Gestos" e a folha da camada (toque longo numa camada da pétala Camadas).
// Só existem com a caneta parada: fecham quando o papel ou a roda são tocados (ver wheel.paperDown).

import { INKS, PAPERS, FPS_OPTIONS } from '../config.js';
import { layerTicks as loopTicks } from '../doc/project.js';
import { confirmDialog } from './dialog.js';
import { downloadProject, pickProjectFile, projectFromText } from '../io/file.js';
import { fmtSeconds } from '../io/video.js';
import { fitView, isFit } from '../view.js';
import { inkOf, DRUMS, expoOf, MAX_EXPO } from '../doc/project.js';
import { drawThumb } from '../render/thumb.js';
import { LPI_OPTIONS } from '../config.js';

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

  // "Salvo neste aparelho às 14:32" — mostra que o salvamento automático está acontecendo.
  function statusText() {
    if (app.saveError) return 'Não deu para salvar neste aparelho. Salve um arquivo.';
    if (app.unsaved) return 'Salvando…';
    if (!app.savedAt) return 'Salva sozinho neste aparelho';
    const t = new Date(app.savedAt);
    return `Salvo neste aparelho às ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
  }
  function refreshStatus() {
    const st = el.querySelector('.save-status');
    if (st) st.textContent = statusText();
  }

  function buildMenu() {
    const s = app.project.settings;
    el.setAttribute('aria-label', 'Menu');
    el.innerHTML = `
      <div class="sheet-group">
        <label>Nome do projeto <input type="text" data-k="name" maxlength="60" autocomplete="off"></label>
        <div class="save-status"></div>
        <div class="row">
          <button class="btn small" data-act="save">Salvar arquivo</button>
          <button class="btn small" data-act="open">Abrir arquivo</button>
        </div>
        <div class="row">
          <button class="btn small" data-act="new">Novo projeto</button>
          <button class="btn small" data-act="png">Exportar PNG</button>
        </div>
        <button class="btn small" data-act="video"${app.canRecordVideo ? '' : ' disabled'}>Exportar vídeo do loop</button>
      </div>
      <div class="sheet-group">
        <div class="sheet-title">Impressão</div>
        <label>Papel <select data-k="paper"></select></label>
        <label>Grão <input type="range" data-k="grain" min="0" max="1" step="0.01"></label>
        <label>Desalinhamento <input type="range" data-k="mis" min="0" max="1" step="0.01"></label>
        <label class="check"><input type="checkbox" data-k="ferver"> Ferver</label>
        <div class="lp-row"><span>Lineatura</span><div class="lp-lpi"></div></div>
        <label class="check"><input type="checkbox" data-k="trapping"> Trapping (balde avança por baixo da linha)</label>
        <div class="sheet-title">Tintas prontas</div>
        <div class="row">
          <button class="btn small" data-act="cmyk">Falso CMYK</button>
          <button class="btn small" data-act="inks-back"${app.inksBeforePreset ? '' : ' disabled'}>Do projeto</button>
        </div>
      </div>
      <div class="sheet-group">
        <div class="sheet-title">Desenho e roda</div>
        <label>Suavizar traço <input type="range" data-k="smooth" min="0" max="1" step="0.05"></label>
        <label class="check"><input type="checkbox" data-k="auto"> Auto (cada traço anda um frame)</label>
        <label class="check"><input type="checkbox" data-k="autoBack"> Auto volta em vez de avançar</label>
        <label class="check"><input type="checkbox" data-k="autoStop"> Auto para no último frame</label>
        <div class="lp-row"><span>Cebola</span><div class="lp-onion-b"></div></div>
        <div class="lp-row"><span></span><div class="lp-onion-a"></div></div>
        <label>Intensidade do papel-cebola <input type="range" data-k="onionStrength" min="0.1" max="0.8" step="0.05"></label>
        <label class="check"><input type="checkbox" data-k="pinWheel"> Fixar roda</label>
        <label class="check"><input type="checkbox" data-k="lefty"> Canhoto</label>
        <label class="check"><input type="checkbox" data-k="debug"> Teste da Fase 0</label>
        <button class="btn small" data-act="gestures">Gestos</button>
        <button class="btn small" data-act="fit"${app.view && !isFit(app.view) ? '' : ' disabled'}>Encaixar papel (100%)</button>
      </div>
      <div class="version">Grão ${app.version}</div>`;
    const q = (k) => el.querySelector(`[data-k="${k}"]`);
    const act = (a) => el.querySelector(`[data-act="${a}"]`);
    const paper = q('paper');
    for (const [k, p] of Object.entries(PAPERS)) paper.add(new Option(p.name, k));
    paper.value = app.project.paper;
    q('name').value = app.project.name;
    q('grain').value = s.grain;
    q('mis').value = s.mis;
    q('smooth').value = s.smooth || 0;
    for (const k of ['ferver', 'auto', 'pinWheel', 'lefty', 'trapping', 'autoStop']) q(k).checked = !!s[k];
    q('autoBack').checked = s.autoDir === 'back';
    q('autoBack').onchange = (e) => { s.autoDir = e.target.checked ? 'back' : 'forward'; app.requestSave(); };
    q('autoStop').onchange = (e) => { s.autoStop = e.target.checked; app.requestSave(); };
    q('onionStrength').value = s.onion.strength;
    q('onionStrength').oninput = (e) => { s.onion.strength = +e.target.value; app.requestSave(); };
    for (const [cls, key, label] of [['.lp-onion-b', 'before', 'Antes'], ['.lp-onion-a', 'after', 'Depois']]) {
      const box = el.querySelector(cls);
      const tag = document.createElement('span');
      tag.className = 'lp-tag'; tag.textContent = label;
      box.appendChild(tag);
      [0, 1, 2].forEach((v) => {
        const b = document.createElement('button');
        b.className = 'btn small' + (s.onion[key] === v ? ' on' : '');
        b.textContent = v;
        b.onclick = () => { s.onion[key] = v; app.requestSave(); buildMenu(); };
        box.appendChild(b);
      });
    }
    const lpi = el.querySelector('.lp-lpi');
    LPI_OPTIONS.forEach((v) => {
      const b = document.createElement('button');
      b.className = 'btn small' + (v === s.lpi ? ' on' : '');
      b.textContent = v;
      b.onclick = () => { s.lpi = v; app.requestSave(); buildMenu(); };
      lpi.appendChild(b);
    });
    q('debug').checked = !!app.debug?.visible;
    refreshStatus();

    q('name').oninput = (e) => { app.project.name = e.target.value.slice(0, 60) || 'Sem título'; app.requestSave(); };
    q('name').onkeydown = (e) => { if (e.key === 'Enter') e.target.blur(); };
    q('grain').oninput = (e) => { s.grain = +e.target.value; app.requestSave(); };
    q('mis').oninput = (e) => { s.mis = +e.target.value; app.requestSave(); };
    q('smooth').oninput = (e) => { s.smooth = +e.target.value; app.requestSave(); };
    for (const k of ['ferver', 'auto', 'pinWheel']) q(k).onchange = (e) => { s[k] = e.target.checked; app.requestSave(); };
    q('trapping').onchange = (e) => {
      s.trapping = e.target.checked;
      app.requestSave();
      app.markAllFills?.();                 // os baldes são refeitos com ou sem trapping
    };
    act('cmyk').onclick = () => { app.applyFalseCmyk(); buildMenu(); };
    act('inks-back').onclick = () => { app.restoreProjectInks(); buildMenu(); };
    q('lefty').onchange = (e) => { s.lefty = e.target.checked; app.requestSave(); position(); };
    paper.onchange = () => { app.project.paper = paper.value; app.requestSave(); };
    q('debug').onchange = (e) => app.debug.setVisible(e.target.checked);

    act('save').onclick = () => {
      downloadProject(app.project);
      app.toast('Arquivo salvo. Procure em Downloads.');
    };
    act('open').onclick = async () => {
      close();
      const file = await pickProjectFile();
      if (!file) return;
      const p = projectFromText(file.text);
      if (!p) { app.toast('Não deu para abrir. Esse arquivo não é um projeto do Grão.'); return; }
      const ok = await confirmDialog({
        text: `Abrir "${p.name}"? O desenho atual será trocado. Salve um arquivo antes, se quiser guardar.`,
        ok: 'Abrir',
      });
      if (ok) { app.replaceProject(p); app.toast('Projeto aberto'); }
    };
    act('png').onclick = () => app.exportPNG();
    act('gestures').onclick = () => open('gestures');
    act('fit').onclick = () => { fitView(app.view); app.input?.redrawOverlay(); close(); };
    act('video').onclick = () => { close(); app.exportVideo(); };
    act('new').onclick = async () => {
      close();
      const ok = await confirmDialog({
        text: 'Começar um projeto novo? O desenho atual será apagado deste aparelho.',
        ok: 'Apagar e começar',
      });
      if (ok) app.newProject();
    };
  }

  // Lista dos gestos de 2 dedos (textos do doc 11, seção "Gestos"). Fecha ao tocar fora, como as outras folhas.
  function buildGestures() {
    el.setAttribute('aria-label', 'Gestos com 2 dedos');
    el.innerHTML = `
      <div class="sheet-title">Gestos com 2 dedos</div>
      <dl class="gestures">
        <dt>Tocar rápido</dt><dd>Desfaz o último passo.</dd>
        <dt>Arrastar para os lados</dt><dd>Anda no tempo, frame a frame. Com o papel inteiro na tela.</dd>
        <dt>Abrir ou fechar os dedos</dt><dd>Aproxima e afasta o papel. Com zoom, arrastar move o papel.</dd>
        <dt>Sobre a seleção</dt><dd>Move, gira e muda o tamanho do que foi selecionado.</dd>
      </dl>
      <div class="sheet-note">A palma apoiada é ignorada enquanto a caneta está perto da tela.</div>`;
  }

  // Folha Tempo (#036): tira de frames com miniaturas, operações de frame, exposição, FPS.
  function buildTime() {
    const p = app.project;
    const i = p.activeLayer;
    const layer = p.layers[i];
    const cur = app.clock.frameOf(layer);
    el.setAttribute('aria-label', 'Tempo');
    el.innerHTML = `
      <div class="sheet-title">Tempo da camada ${i + 1} · ${inkOf(p, layer).name}</div>
      <div class="strip" role="list"></div>
      <div class="row">
        <button class="btn small" data-act="ins">Inserir</button>
        <button class="btn small" data-act="dupf">Duplicar</button>
        <button class="btn small" data-act="delf">Apagar</button>
      </div>
      <div class="row">
        <button class="btn small" data-act="left" aria-label="Mover frame para trás"${cur > 0 ? '' : ' disabled'}>← Mover</button>
        <button class="btn small" data-act="right" aria-label="Mover frame para a frente"${cur < layer.frames.length - 1 ? '' : ' disabled'}>Mover →</button>
      </div>
      <div class="lp-row"><span>Exposição</span><div class="lp-expo"></div></div>
      <div class="lp-row"><span>FPS</span><div class="lp-fps"></div></div>
      <div class="lp-row"><span>Frames</span>
        <button class="btn small" data-act="frames-" aria-label="Remover o último frame">−</button>
        <b class="lp-count">${layer.frames.length}</b>
        <button class="btn small" data-act="frames+" aria-label="Adicionar frame no fim">+</button>
      </div>
      <div class="sheet-note">Cada camada tem o próprio loop. Duração: ${fmtSeconds(loopTicks(layer) / layer.fps)}.</div>`;
    const strip = el.querySelector('.strip');
    const paper = (PAPERS[p.paper] || PAPERS.natural).hex;
    layer.frames.forEach((fr, f) => {
      const b = document.createElement('button');
      b.className = 'thumb' + (f === cur ? ' on' : '');
      b.setAttribute('role', 'listitem');
      b.setAttribute('aria-label', `Frame ${f + 1}${expoOf(layer, f) > 1 ? `, ${expoOf(layer, f)} tempos` : ''}`);
      const cv = document.createElement('canvas');
      drawThumb(cv, fr, inkOf(p, layer).hex, paper);
      const lab = document.createElement('span');
      lab.textContent = `${f + 1}${expoOf(layer, f) > 1 ? ` ×${expoOf(layer, f)}` : ''}`;
      b.append(cv, lab);
      b.onclick = () => { app.clock.paused = true; app.clock.goTo(layer, f); buildTime(); };
      strip.appendChild(b);
    });
    strip.querySelector('.on')?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
    const act = (a) => el.querySelector(`[data-act="${a}"]`);
    const then = (ok) => { if (ok) app.clock.paused = true; buildTime(); };
    act('ins').onclick = () => then(app.insertFrame());
    act('dupf').onclick = () => then(app.duplicateFrame());
    act('delf').onclick = () => then(app.deleteFrame());
    act('left').onclick = () => then(app.moveFrame(-1));
    act('right').onclick = () => then(app.moveFrame(+1));
    const expo = el.querySelector('.lp-expo');
    for (let n = 1; n <= MAX_EXPO; n++) {
      const b = document.createElement('button');
      b.className = 'btn small' + (expoOf(layer, cur) === n ? ' on' : '');
      b.textContent = `×${n}`;
      b.setAttribute('aria-label', `Frame fica ${n} tempos`);
      b.onclick = () => then(app.setExpo(n));
      expo.appendChild(b);
    }
    const fps = el.querySelector('.lp-fps');
    FPS_OPTIONS.forEach((v) => {
      const b = document.createElement('button');
      b.className = 'btn small' + (v === layer.fps ? ' on' : '');
      b.textContent = v;
      b.onclick = () => { layer.fps = v; app.requestSave(); buildTime(); };
      fps.appendChild(b);
    });
    act('frames+').onclick = () => then(app.appendFrame());
    act('frames-').onclick = () => then(app.popFrame());
  }

  // Folha da camada (#029): tinta (tambor e cor), retícula (#030), visível, travar, ordem, duplicar, apagar.
  let sheetLayer = 0;
  function buildLayer() {
    const p = app.project;
    const i = Math.min(sheetLayer, p.layers.length - 1);
    sheetLayer = i;
    const L = p.layers[i];
    el.setAttribute('aria-label', `Camada ${i + 1}`);
    const drums = Array.from({ length: DRUMS }, (_, d) =>
      `<button class="swatch${L.ink === d ? ' on' : ''}" data-drum="${d}" style="background:${INKS[p.inks[d]].hex}" aria-label="Tinta ${d + 1}: ${INKS[p.inks[d]].name}">${d + 1}</button>`).join('');
    const colors = INKS.map((k, j) =>
      `<button class="swatch small${p.inks[L.ink] === j ? ' on' : ''}" data-color="${j}" style="background:${k.hex}" aria-label="${k.name}"></button>`).join('');
    const dens = Math.round(L.screen.density * 100);
    el.innerHTML = `
      <div class="sheet-title">Camada ${i + 1}</div>
      <div class="sheet-group">
        <div class="sheet-title">Tinta</div>
        <div class="swatches">${drums}</div>
        <div class="sheet-note">Cor da tinta ${L.ink + 1}: ${inkOf(p, L).name}</div>
        <div class="swatches">${colors}</div>
      </div>
      <div class="sheet-group">
        <div class="sheet-title">Retícula</div>
        <div class="row">
          <button class="btn small${L.screen.type === 'stochastic' ? ' on' : ''}" data-act="stochastic">Estocástica</button>
          <button class="btn small${L.screen.type === 'am' ? ' on' : ''}" data-act="am">Reticulada</button>
        </div>
        <label>Densidade <span class="dens-val">${dens}%</span>
          <input type="range" data-k="density" min="5" max="100" step="1" value="${dens}"></label>
      </div>
      <div class="sheet-group">
        <label class="check"><input type="checkbox" data-k="visible"${L.visible ? ' checked' : ''}> Visível</label>
        <label class="check"><input type="checkbox" data-k="locked"${L.locked ? ' checked' : ''}> Travar</label>
        <div class="row">
          <button class="btn small" data-act="up"${i < p.layers.length - 1 ? '' : ' disabled'}>Subir</button>
          <button class="btn small" data-act="down"${i > 0 ? '' : ' disabled'}>Descer</button>
        </div>
        <button class="btn small" data-act="dup">Duplicar camada</button>
        <button class="btn small" data-act="del"${p.layers.length > 1 ? '' : ' disabled'}>Apagar camada</button>
      </div>`;
    const q = (k) => el.querySelector(`[data-k="${k}"]`);
    const act = (a) => el.querySelector(`[data-act="${a}"]`);
    el.querySelectorAll('[data-drum]').forEach((b) => { b.onclick = () => { app.setLayerInk(i, +b.dataset.drum); buildLayer(); }; });
    el.querySelectorAll('[data-color]').forEach((b) => { b.onclick = () => { app.setDrumColor(L.ink, +b.dataset.color); buildLayer(); }; });
    act('stochastic').onclick = () => { app.setLayerScreen(i, { type: 'stochastic' }); buildLayer(); };
    act('am').onclick = () => { app.setLayerScreen(i, { type: 'am' }); buildLayer(); };
    // Densidade: muda ao vivo enquanto arrasta; entra no desfazer uma vez, ao soltar.
    let densBefore = null;
    q('density').oninput = (e) => {
      if (!densBefore) densBefore = app.layerSnapshot();
      L.screen = { ...L.screen, density: Math.max(0.05, Math.min(1, +e.target.value / 100)) };
      el.querySelector('.dens-val').textContent = `${e.target.value}%`;
    };
    q('density').onchange = () => { if (densBefore) app.commitLayers(densBefore); densBefore = null; };
    q('visible').onchange = () => { app.toggleLayerVisible(i); buildLayer(); };
    q('locked').onchange = () => { app.toggleLayerLock(i); buildLayer(); };
    act('up').onclick = () => { if (app.moveLayer(i, +1)) sheetLayer = i + 1; buildLayer(); };
    act('down').onclick = () => { if (app.moveLayer(i, -1)) sheetLayer = i - 1; buildLayer(); };
    act('dup').onclick = () => { if (app.duplicateLayer(i)) sheetLayer = i + 1; buildLayer(); };
    act('del').onclick = async () => {
      const hasDrawing = L.frames.some((fr) => fr.length);
      if (hasDrawing) {
        close();
        const ok = await confirmDialog({
          text: `Apagar a camada ${i + 1}? O desenho dela some de todos os frames.`,
          ok: 'Apagar camada',
        });
        if (ok) app.deleteLayer(i);
        return;
      }
      app.deleteLayer(i);
      close();
    };
  }

  function open(m, arg) {
    mode = m;
    if (m === 'layer') sheetLayer = arg ?? app.project.activeLayer;
    if (m === 'more') buildMenu();
    else if (m === 'gestures') buildGestures();
    else if (m === 'layer') buildLayer();
    else buildTime();
    position();
    el.hidden = false;
  }

  function close() {
    if (!mode) return;
    if (el.contains(document.activeElement)) document.activeElement.blur();   // fecha o teclado do nome
    mode = null;
    el.hidden = true;
    el.innerHTML = '';
  }

  return { open, close, refreshStatus, get mode() { return mode; } };
}

