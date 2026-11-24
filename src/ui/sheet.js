// Folhas compactas perto da roda (HTML): "Menu" (arquivo e ajustes) e "Tempo" (FPS e frames da tinta ativa).
// Só existem com a caneta parada: fecham quando o papel ou a roda são tocados (ver wheel.paperDown).

import { INKS, PAPERS, FPS_OPTIONS, MAX_FRAMES } from '../config.js';
import { confirmDialog } from './dialog.js';
import { downloadProject, pickProjectFile, projectFromText } from '../io/file.js';
import { fmtSeconds } from '../io/video.js';
import { fitView, isFit } from '../view.js';

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
      </div>
      <div class="sheet-group">
        <div class="sheet-title">Desenho e roda</div>
        <label>Suavizar traço <input type="range" data-k="smooth" min="0" max="1" step="0.05"></label>
        <label class="check"><input type="checkbox" data-k="auto"> Auto (cada traço avança um frame)</label>
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
    for (const k of ['ferver', 'auto', 'pinWheel', 'lefty']) q(k).checked = !!s[k];
    q('debug').checked = !!app.debug?.visible;
    refreshStatus();

    q('name').oninput = (e) => { app.project.name = e.target.value.slice(0, 60) || 'Sem título'; app.requestSave(); };
    q('name').onkeydown = (e) => { if (e.key === 'Enter') e.target.blur(); };
    q('grain').oninput = (e) => { s.grain = +e.target.value; app.requestSave(); };
    q('mis').oninput = (e) => { s.mis = +e.target.value; app.requestSave(); };
    q('smooth').oninput = (e) => { s.smooth = +e.target.value; app.requestSave(); };
    for (const k of ['ferver', 'auto', 'pinWheel']) q(k).onchange = (e) => { s[k] = e.target.checked; app.requestSave(); };
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

  function buildTime() {
    const i = app.project.activeLayer;
    const layer = app.project.layers[i];
    el.setAttribute('aria-label', 'Tempo');
    el.innerHTML = `
      <div class="sheet-title">Tempo da tinta ${INKS[layer.ink].name}</div>
      <div class="lp-row"><span>FPS</span><div class="lp-fps"></div></div>
      <div class="lp-row"><span>Frames</span>
        <button class="btn small" data-act="frames-" aria-label="Remover frame">−</button>
        <b class="lp-count">${layer.frames.length}</b>
        <button class="btn small" data-act="frames+" aria-label="Adicionar frame">+</button>
      </div>
      <div class="sheet-note">Cada tinta tem o próprio loop. Duração: ${fmtSeconds(layer.frames.length / layer.fps)}.</div>`;
    const fps = el.querySelector('.lp-fps');
    FPS_OPTIONS.forEach((v) => {
      const b = document.createElement('button');
      b.className = 'btn small' + (v === layer.fps ? ' on' : '');
      b.textContent = v;
      b.onclick = () => { layer.fps = v; app.requestSave(); buildTime(); };
      fps.appendChild(b);
    });
    el.querySelector('[data-act="frames+"]').onclick = () => {
      if (layer.frames.length >= MAX_FRAMES) { app.toast('Máximo de 12 frames por camada.'); return; }
      layer.frames.push([]);
      app.selection = null; app.onSelectionChange?.();
      app.requestSave(); buildTime();
    };
    el.querySelector('[data-act="frames-"]').onclick = () => {
      if (layer.frames.length <= 1) return;
      if (layer.frames[layer.frames.length - 1].length) { app.toast('Esse frame tem desenho. Apague antes de remover.'); return; }
      layer.frames.pop();
      app.masks.drop(i, layer.frames.length);
      app.selection = null; app.onSelectionChange?.();
      app.requestSave(); buildTime();
    };
  }

  function open(m) {
    mode = m;
    if (m === 'more') buildMenu(); else if (m === 'gestures') buildGestures(); else buildTime();
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

