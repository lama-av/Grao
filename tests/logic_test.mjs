// Teste de lógica do Grão, sem navegador: roda input.js, wheel.js e actions.js de verdade com um "DOM de
// mentira" (canvas e contexto 2D que aceitam tudo) e eventos de caneta e dedo simulados.
// Não testa desenho nem GPU (isso fica com tests/smoke_test.py e com o tablet); testa as regras.
//
// Rodar (o VS Code já traz um Node dentro):
//   PowerShell:  $env:ELECTRON_RUN_AS_NODE=1; & "$env:LOCALAPPDATA\Programs\Microsoft VS Code\Code.exe" tests/logic_test.mjs
//   Git Bash:    ELECTRON_RUN_AS_NODE=1 "$LOCALAPPDATA/Programs/Microsoft VS Code/Code.exe" tests/logic_test.mjs
//   Com Node instalado: node tests/logic_test.mjs

// ---------- DOM de mentira ----------
const W = 1080, H = 720;
const ctxStub = () => new Proxy({}, {
  get(t, k) {
    if (k in t) return t[k];
    if (k === 'measureText') return () => ({ width: 10 });
    if (k === 'getContextAttributes') return () => ({});
    return () => {};
  },
  set(t, k, v) { t[k] = v; return true; },
});
function fakeCanvas() {
  const listeners = {};
  return {
    width: 0, height: 0, style: {}, dataset: {},
    getContext: () => ctxStub(),
    getBoundingClientRect: () => ({ left: 0, top: 0, x: 0, y: 0, width: W, height: H }),
    addEventListener(t, f) { (listeners[t] ??= []).push(f); },
    setPointerCapture() {},
    fire(type, e) { e.type = type; for (const f of listeners[type] || []) f(e); },
  };
}
globalThis.location = { search: '' };
globalThis.ResizeObserver = class { observe() {} };
globalThis.window = { addEventListener() {}, devicePixelRatio: 1 };

// ---------- app como o main.js monta (sem GPU) ----------
const { newProject, sanitize } = await import('../src/doc/project.js');
const { History } = await import('../src/doc/history.js');
const { Clock } = await import('../src/clock/clock.js');
const { installActions } = await import('../src/actions.js');
const { setupWheel } = await import('../src/ui/wheel.js');
const { setupInput } = await import('../src/input/input.js');
const { createView, docToUv, uvToDoc, pinch, settle, fitView } = await import('../src/view.js');

const toasts = [];
function makeApp() {
  const app = {
    version: 'teste', project: newProject(), clock: new Clock(), selection: null, lassoHeld: false,
    tool: 'brush', historyUntil: 0, lowLatency: false, dirty: new Set(), view: createView(),
  };
  app.history = new History(app);
  app.markDirty = (l, f) => app.dirty.add(`${l}:${f}`);
  app.requestSave = () => {};
  app.saveNow = () => {};
  app.toast = (m) => toasts.push(m);
  app.masks = { clear() {}, rebuildAll() {}, drop() {}, rebuild() {}, prune() {}, empty: null };
  installActions(app);
  app.sheet = { mode: null, open(m) { this.mode = m; }, close() { this.mode = null; } };
  app.debug = { pointer() {}, frame() {}, box: { dataset: {} } };
  const ui = fakeCanvas(), wet = fakeCanvas();
  app.ui = setupWheel(app, ui);
  app.input = setupInput(app, wet);
  wet.app = app;
  return { app, wet };
}

// ---------- ajudantes ----------
let fails = 0, total = 0;
function check(name, ok, info = '') {
  total++;
  if (!ok) fails++;
  console.log(`${ok ? 'OK   ' : 'FALHA'} ${name}${info !== '' ? ' — ' + info : ''}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let nextId = 1;
function pointer(wet, type = 'pen') {
  const id = nextId++;
  const send = (kind, x, y, buttons = 0, button = -1, pressure) => wet.fire(kind, {
    pointerId: id, pointerType: type, clientX: x, clientY: y, buttons, button,
    pressure: pressure ?? (buttons & 1 ? 0.6 : 0),
  });
  return {
    // Dedo: por padrão simula a caneta longe há tempo (o filtro de palma ignora toques logo depois da caneta).
    down: (x, y, b = 1, btn = 0, p) => {
      if (type === 'touch' && wet.app && wet.autoPenAway !== false) wet.app.input.gestures.penGone(-1e9);
      send('pointerdown', x, y, b, btn, p);
    },
    move: (x, y, b = 0, p) => send('pointermove', x, y, b, -1, p),
    up: (x, y, b = 0, btn = 0) => send('pointerup', x, y, b, btn),
    cancel: (x, y) => send('pointercancel', x, y, 0, -1),
    leave: (x, y) => send('pointerleave', x, y, 0, -1),
  };
}
function stroke(wet, x0, y0, n = 10, type = 'pen') {
  const p = pointer(wet, type);
  p.down(x0, y0);
  for (let i = 1; i <= n; i++) p.move(x0 + i * 10, y0 + i * 5, 1);
  p.up(x0 + n * 10, y0 + n * 5);
}
const all = (app) => app.project.layers.flatMap((L) => L.frames.flat());
const BTN = [48, H - 48], WC = [148, H - 148];
const at = (r, a) => [WC[0] + Math.cos(a * Math.PI / 180) * r, WC[1] + Math.sin(a * Math.PI / 180) * r];
function tap(wet, x, y, type = 'touch') { const p = pointer(wet, type); p.down(x, y); p.up(x, y); }

// ---------- caneta e dedo ----------
{
  const { app, wet } = makeApp();
  stroke(wet, 300, 200);
  check('caneta desenha um traço', all(app).length === 1 && all(app)[0].kind === 'ink');
  stroke(wet, 500, 300, 10, 'touch');
  check('1 dedo não desenha', all(app).length === 1);
}

// ---------- botão lateral 1: alterna Pincel / Borracha ----------
{
  const { app, wet } = makeApp();
  const pen = pointer(wet);
  pen.move(400, 300, 0);                       // no ar
  pen.down(400, 300, 2, 2);                    // aperta o botão 1 no ar
  check('botão 1 no ar troca para Borracha', app.tool === 'eraser');
  check('botão 1 no ar não desenha', all(app).length === 0);
  pen.up(400, 300, 0, 2);
  stroke(wet, 300, 200);
  check('depois do botão 1, o traço apaga', all(app)[0]?.kind === 'cut');
  const pen2 = pointer(wet);
  pen2.move(400, 300, 0); pen2.down(400, 300, 2, 2); pen2.up(400, 300, 0, 2);
  check('botão 1 de novo volta ao Pincel', app.tool === 'brush');
  // segurar o botão não fica trocando a cada evento
  const pen3 = pointer(wet);
  pen3.down(400, 300, 2, 2); pen3.move(410, 300, 2); pen3.move(420, 300, 2); pen3.up(420, 300, 0, 2);
  check('segurar o botão 1 troca uma vez só', app.tool === 'eraser');
  app.tool = 'brush';
  // apertar com a ponta encostada: o traço atual continua de tinta, o próximo já é borracha
  const pen4 = pointer(wet);
  pen4.down(200, 500, 1, 0); pen4.move(220, 500, 1); pen4.move(240, 500, 3); pen4.move(260, 500, 3); pen4.up(260, 500, 0);
  const last = app.project.layers[0].frames.flat().at(-1);
  check('botão 1 durante o traço não corta o traço', last.kind === 'ink' && last.pts.length >= 9);
  check('botão 1 durante o traço troca a ferramenta', app.tool === 'eraser');
  // no ar, por cima do botão da roda: não abre a roda
  app.tool = 'brush';
  const pen5 = pointer(wet);
  pen5.move(...BTN, 0); pen5.down(...BTN, 2, 2); pen5.up(...BTN, 0, 2);
  check('botão 1 no ar sobre a roda não abre a roda', !app.ui.isOpen && app.tool === 'eraser');
  // mouse: botão direito também alterna (para testar no PC)
  const m = pointer(wet, 'mouse');
  m.down(600, 300, 2, 2); m.up(600, 300, 0, 2);
  check('botão direito do mouse alterna', app.tool === 'brush');
}

// ---------- botão lateral 2: segura o Laço ----------
// (4 = botão do meio: aparece também com a caneta no ar. O caso 32, "borracha", está mais abaixo.)
for (const code of [4]) {
  const { app, wet } = makeApp();
  app.clock.paused = false;
  stroke(wet, 300, 300);                        // algo para laçar (de 300,300 a 400,350)
  const pen = pointer(wet);
  pen.move(250, 250, 0);
  pen.down(250, 250, code, code === 4 ? 1 : 5);
  check(`botão 2 (${code}) segura o Laço`, app.lassoHeld && app.clock.holds.has('lasso'));
  check(`botão 2 (${code}) congela o loop`, app.clock.frozen);
  // a ponta encosta com o botão apertado: chega como pointermove (botões = código + 1)
  const poly = [[250, 250], [450, 250], [450, 400], [250, 400], [250, 260]];
  for (const [x, y] of poly) pen.move(x, y, code | 1, 0.5);
  pen.move(250, 260, code, 0);                  // ponta levantou, botão ainda apertado
  check(`laço com botão 2 (${code}) seleciona`, app.selection?.ids.size === 1, String(app.selection?.ids.size));
  check(`laço com botão 2 (${code}) não desenhou`, all(app).length === 1);
  pen.up(250, 260, 0, code === 4 ? 1 : 5);
  check(`soltar o botão 2 (${code}) solta o Laço`, !app.lassoHeld && !app.clock.holds.has('lasso'));
  check(`seleção continua segurando o loop`, app.clock.holds.has('selection'));
}
{
  const { app, wet } = makeApp();
  const pen = pointer(wet);
  pen.move(250, 250, 0); pen.down(250, 250, 4, 1);
  pen.leave(250, 250);
  check('caneta sai do alcance com o botão 2: solta o Laço', !app.lassoHeld && app.clock.holds.size === 0);
}

// ---------- roda ----------
{
  const { app, wet } = makeApp();
  stroke(wet, 300, 200);
  tap(wet, ...BTN);
  check('toque no botão abre a roda', app.ui.isOpen);
  app.clock.paused = false;
  tap(wet, ...WC);
  check('centro pausa', app.clock.paused === true);
  // prato: girar 95° anda 3 frames e segura o loop enquanto encosta
  app.clock.t = 0;
  const f = pointer(wet, 'touch');
  const pts = Array.from({ length: 11 }, (_, i) => at(100, -90 + i * 9.5));
  f.down(...pts[0]);
  for (const q of pts.slice(1)) f.move(...q);
  check('prato segura o loop', app.clock.holds.has('wheel'));
  f.up(...pts.at(-1));
  check('prato anda 3 frames', app.clock.frameOf(app.project.layers[0]) === 3, app.clock.frameOf(app.project.layers[0]));
  check('soltar o prato solta o loop', !app.clock.holds.has('wheel'));
  // desfazer e refazer pelos setores (-120° e -60°)
  app.clock.t = 0;
  tap(wet, ...at(58, -120));
  check('Desfazer pela roda', all(app).length === 0);
  tap(wet, ...at(58, -60));
  check('Refazer pela roda', all(app).length === 1);
  // pétala Tinta por arrastar e soltar (setor em 180°)
  const base = -45, step = 17;
  const inkAt = (k, n = 5) => at(218, base - (step * (n - 1)) / 2 + step * k);   // 4 camadas + "+"
  const d = pointer(wet, 'touch');
  d.down(...at(58, 180));
  check('encostar em Camadas abre a pétala', app.ui.petal === 'ink');
  d.move(...at(120, 200)); d.move(...inkAt(2)); d.up(...inkAt(2));
  check('arrastar e soltar escolhe a camada', app.project.activeLayer === 2);
  check('a pétala fecha ao escolher', app.ui.petal === null);
  // tocar e tocar continua funcionando
  tap(wet, ...at(58, 180));
  tap(wet, ...inkAt(1));
  check('tocar e tocar escolhe a camada', app.project.activeLayer === 1);
  // toque longo numa camada abre a folha da camada
  tap(wet, ...at(58, 180));
  const lp = pointer(wet, 'touch');
  lp.down(...inkAt(0));
  await sleep(600);
  check('toque longo numa camada abre a folha da camada', app.sheet.mode === 'layer');
  lp.up(...inkAt(0));
  check('soltar depois do toque longo não troca a camada ativa', app.project.activeLayer === 1);
  // pétala Ferramenta: Borracha
  app.ui.collapse(); tap(wet, ...BTN);
  tap(wet, ...at(58, 0));
  tap(wet, ...at(282, base - step));   // arco Mexer (fora): Borracha, Balde, Laço
  check('escolher Borracha na pétala', app.tool === 'eraser');
  app.tool = 'brush';
  // recolhe ao desenhar
  stroke(wet, 600, 150, 3);
  check('roda recolhe ao desenhar', !app.ui.isOpen);
}
{
  // mover o botão de canto: segurar 0,4 s e arrastar
  const { app, wet } = makeApp();
  const f = pointer(wet, 'touch');
  f.down(...BTN);
  await sleep(450);
  f.move(W - 60, 60); f.up(W - 60, 60);
  check('mover a roda para outro canto', app.project.settings.wheelCorner === 'tr', app.project.settings.wheelCorner);
  check('soltar depois de arrastar não abre a roda', !app.ui.isOpen);
}

// ---------- 2 dedos ----------
{
  const { app, wet } = makeApp();
  stroke(wet, 300, 200);
  const a = pointer(wet, 'touch'), b = pointer(wet, 'touch');
  a.down(500, 400); b.down(800, 400); a.up(500, 400); b.up(800, 400);
  check('toque rápido de 2 dedos desfaz', all(app).length === 0);
}

// ---------- arco de cores da pétala Tinta ----------
{
  const { app, wet } = makeApp();
  tap(wet, ...BTN);
  tap(wet, ...at(58, 180));
  check('pétala Tinta aberta', app.ui.petal === 'ink');
  const colorArc = (j) => at(282, -45 - (14 * 8) / 2 + 14 * j);      // 9 cores
  tap(wet, ...colorArc(6));
  check('tocar numa cor do arco troca a cor da tinta (tambor) da camada ativa', app.project.inks[0] === 6, app.project.inks[0]);
  check('a pétala continua aberta depois de trocar a cor', app.ui.petal === 'ink');
  const d = pointer(wet, 'touch');
  d.down(...colorArc(4)); d.move(...colorArc(5)); d.move(...colorArc(7)); d.up(...colorArc(7));
  check('arrastar no arco e soltar troca a cor', app.project.inks[0] === 7);
}

// ---------- arquivo .grao ----------
{
  const { projectToText, projectFromText, fileNameFor } = await import('../src/io/file.js');
  const { app, wet } = makeApp();
  stroke(wet, 300, 200);
  app.project.name = 'Meu loop: ação!';
  app.project.inks[2] = 6;
  const back = projectFromText(projectToText(app.project));
  check('salvar e abrir devolve os mesmos traços', JSON.stringify(back.layers) === JSON.stringify(app.project.layers));
  check('salvar e abrir devolve nome e papel', back.name === 'Meu loop: ação!' && back.paper === app.project.paper);
  check('nome de arquivo sem acento nem símbolo', fileNameFor(app.project) === 'Meu-loop-acao.grao', fileNameFor(app.project));
  check('texto que não é JSON não abre', projectFromText('isso não é um projeto') === null);
  check('JSON de outra coisa não abre', projectFromText('{"format":"outro","layers":[]}') === null);
  // arquivo estragado: traços ruins somem, o resto é aproveitado
  const bad = JSON.parse(projectToText(app.project));
  bad.layers[0].frames[0].push({ id: 'x', kind: 'ink', w: 5, pts: [1, 2, 3] });          // id inválido
  bad.layers[0].frames[0].push({ id: 900, kind: 'ink', w: 5, pts: [1, 2] });           // pts incompleto
  bad.layers[0].frames[0].push({ id: 901, kind: 'tinta', w: 5, pts: [1, 2, 3] });      // tipo desconhecido
  bad.layers[0].frames[0].push({ id: 902, kind: 'ink', w: 5, pts: [1, 2, 0.5] });      // válido
  bad.layers[1].ink = 99; bad.layers[1].fps = 7;
  bad.layers.length = 2;                                                                 // só 2 camadas
  bad.nextId = 3; bad.activeLayer = 9; bad.paper = 'papelão';
  bad.settings.sizes = { brush: 9999 }; bad.settings.wheelCorner = 'meio';
  const fixed = projectFromText(JSON.stringify(bad));
  const f0 = fixed.layers[0].frames[0];
  check('arquivo estragado: só os traços bons ficam', f0.length === 2 && f0[1].id === 902, f0.map((s) => s.id).join(','));
  check('arquivo estragado: tinta e FPS inválidos voltam ao padrão', fixed.layers[1].ink === 1 && fixed.layers[1].fps === 8);
  check('arquivo estragado: mantém as 2 camadas e sempre 4 tintas', fixed.layers.length === 2 && fixed.inks.length === 4);
  check('arquivo estragado: próximo id passa do maior id', fixed.nextId === 903, fixed.nextId);
  check('arquivo estragado: tinta ativa, papel e ajustes conferidos',
    fixed.activeLayer === 0 && fixed.paper === 'natural' && fixed.settings.sizes.brush === 40 && fixed.settings.wheelCorner === null);
  // abrir troca o projeto e recomeça o histórico
  app.replaceProject(back);
  check('abrir arquivo troca o projeto', app.project === back);
  check('abrir arquivo recomeça o histórico', !app.history.canUndo);
  // novo projeto mantém o canto da roda e o modo Canhoto
  app.project.settings.wheelCorner = 'tr'; app.project.settings.lefty = true;
  app.newProject();
  check('novo projeto mantém canto da roda e Canhoto', app.project.settings.wheelCorner === 'tr' && app.project.settings.lefty);
  check('novo projeto começa vazio', all(app).length === 0);
}

// ---------- balde (preenchimento) ----------
{
  const { floodFill } = await import('../src/render/fill.js');
  const w = 60, h = 40;
  const img = () => new Uint8ClampedArray(w * h * 4);
  const px = (d, x, y) => d[(y * w + x) * 4];
  const rect = (d, x0, y0, x1, y1) => {                     // contorno de 1 px
    for (let x = x0; x <= x1; x++) for (const y of [y0, y1]) d.fill(255, (y * w + x) * 4, (y * w + x) * 4 + 4);
    for (let y = y0; y <= y1; y++) for (const x of [x0, x1]) d.fill(255, (y * w + x) * 4, (y * w + x) * 4 + 4);
  };
  let d = img(); rect(d, 10, 10, 40, 30);
  const n = floodFill(d, w, h, 25, 20);
  check('balde preenche dentro do contorno', n > 0 && px(d, 25, 20) === 255 && px(d, 12, 12) === 255);
  check('balde não vaza para fora do contorno', px(d, 5, 5) === 0 && px(d, 50, 35) === 0);
  d = img(); rect(d, 10, 10, 40, 30);
  for (let y = 18; y <= 20; y++) d.fill(0, (y * w + 40) * 4, (y * w + 40) * 4 + 4);   // buraco de 3 px na linha
  floodFill(d, w, h, 25, 20);
  check('buraco pequeno na linha não deixa vazar', px(d, 50, 20) === 0);
  d = img(); rect(d, 10, 10, 40, 30);
  check('balde em cima da linha não faz nada', floodFill(d, w, h, 10, 20) === 0);
  d = img();
  check('balde no papel vazio pinta tudo', floodFill(d, w, h, 5, 5) === w * h);
}
{
  const { app, wet } = makeApp();
  app.tool = 'bucket';
  tap(wet, 300, 300, 'pen');
  const s = all(app)[0];
  check('balde grava só o ponto tocado', s?.kind === 'fill' && s.pts.length === 3, JSON.stringify(s));
  check('balde entra no desfazer', app.undo() && all(app).length === 0);
  app.tool = 'brush';
  stroke(wet, 300, 300);
  app.tool = 'bucket';
  tap(wet, 320, 310, 'pen');
  app.tool = 'brush';
  const pen = pointer(wet);
  pen.move(250, 250, 0); pen.down(250, 250, 4, 1);
  for (const [x, y] of [[250, 250], [450, 250], [450, 400], [250, 400], [250, 260]]) pen.move(x, y, 5, 0.5);
  pen.move(250, 260, 4, 0); pen.up(250, 260, 0, 1);
  check('laço pega traço e balde juntos', app.selection?.ids.size === 2, app.selection?.ids.size);
  const { sanitize } = await import('../src/doc/project.js');
  check('arquivo com balde abre', sanitize(JSON.parse(JSON.stringify(app.project))).layers[0].frames.flat().some((x) => x.kind === 'fill'));
}

// ---------- linha reta (segurar a caneta parada) ----------
{
  const { app, wet } = makeApp();
  const pen = pointer(wet);
  pen.down(200, 200);
  for (let i = 1; i <= 20; i++) pen.move(200 + i * 10, 200 + Math.sin(i) * 15, 1);   // traço tremido
  await sleep(600);                                                                 // segura parada
  pen.move(500, 260, 1); pen.up(500, 260);
  const s = all(app)[0];
  check('linha reta tem só começo e fim', s?.pts.length === 6, s?.pts.length);
  check('a ponta da linha segue a caneta depois de endireitar', s && Math.round(s.pts[3]) === Math.round(500 * 1200 / W));
  // pausa curta não endireita
  const pen2 = pointer(wet);
  pen2.down(200, 500);
  for (let i = 1; i <= 10; i++) pen2.move(200 + i * 10, 500 + (i % 2) * 8, 1);
  await sleep(200);
  for (let i = 11; i <= 20; i++) pen2.move(200 + i * 10, 500 + (i % 2) * 8, 1);
  pen2.up(400, 500);
  check('pausa curta não endireita', all(app)[1]?.pts.length > 6);
}

// ---------- vídeo: duração do loop ----------
{
  const { loopSeconds, recordSeconds } = await import('../src/io/video.js');
  const p = newProject();
  p.layers[0].frames[0].push({ id: 1, kind: 'ink', w: 5, pts: [1, 1, 1] });
  check('loop de 8 frames a 8 fps = 1 s', loopSeconds(p) === 1);
  check('loop de 1 s grava 3 s', recordSeconds(p) === 3);
  p.layers[1].frames = Array.from({ length: 12 }, () => []);
  p.layers[1].fps = 8; p.layers[1].frames[0].push({ id: 2, kind: 'ink', w: 5, pts: [1, 1, 1] });
  check('8 frames + 12 frames a 8 fps = ciclo de 3 s', loopSeconds(p) === 3, loopSeconds(p));
  p.layers[2].frames = Array.from({ length: 7 }, () => [{ id: 3, kind: 'ink', w: 5, pts: [1, 1, 1] }]);
  p.layers[2].fps = 6;
  check('ciclo longo é cortado em 12 s', loopSeconds(p) === 12, loopSeconds(p));
  const e = newProject();
  check('projeto vazio usa o loop da tinta ativa', loopSeconds(e) === 1);
}

// ---------- máscaras: atalho de "só o traço novo" ----------
{
  const calls = { full: 0, strokes: 0, fills: 0 };
  const mctx = new Proxy({}, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'fillRect') return () => { calls.full++; };
      if (k === 'beginPath') return () => { calls.strokes++; };
      if (k === 'getImageData') return (x, y, w, h) => { calls.fills++; return { data: new Uint8ClampedArray(w * h * 4) }; };
      return () => {};
    },
    set(t, k, v) { t[k] = v; return true; },
  });
  globalThis.document = { createElement: () => ({ getContext: () => mctx }) };
  const gl = new Proxy({}, { get: (t, k) => (typeof k === 'string' && k === k.toUpperCase() ? 0 : () => ({})) });
  const { Masks } = await import('../src/render/masks.js');
  const m = new Masks(gl);
  const a = { id: 1, kind: 'ink', w: 5, pts: [10, 10, 1, 20, 20, 1] };
  const fill = { id: 2, kind: 'fill', w: 1, pts: [50, 50, 1] };
  const b = { id: 3, kind: 'ink', w: 5, pts: [30, 30, 1, 40, 40, 1] };
  m.rebuild(0, 0, [a, fill]);
  check('máscara nova desenha tudo', calls.full === 1 && calls.fills === 1);
  m.rebuild(0, 0, [a, fill, b]);
  check('traço novo no fim: não refaz o balde', calls.full === 1 && calls.fills === 1);
  m.rebuild(0, 0, [a, fill, b]);
  check('mesma lista de novo (mover a seleção): refaz tudo', calls.full === 2 && calls.fills === 2);
  m.rebuild(0, 1, [a]);
  m.rebuild(0, 0, [a, fill, b, a]);
  check('outro frame no meio: refaz tudo', calls.full === 4);
  m.rebuild(0, 0, [a, fill]);
  check('desfazer (lista menor): refaz tudo', calls.full === 5);
}

// ---------- mover a seleção: cancelar e tocar sem mover ----------
{
  const { app, wet } = makeApp();
  stroke(wet, 300, 300);
  app.tool = 'lasso';
  const l = pointer(wet);
  l.down(250, 250);
  for (const [x, y] of [[450, 250], [450, 400], [250, 400], [250, 260]]) l.move(x, y, 1);
  l.up(250, 260);
  app.tool = 'brush';
  const x0 = all(app)[0].pts[0], depth = app.history.depth;
  const mv = pointer(wet);
  mv.down(320, 310); mv.move(420, 410, 1); mv.cancel(420, 410);
  check('mover cancelado volta ao lugar', all(app)[0].pts[0] === x0 && app.history.depth === depth);
  const t = pointer(wet);
  t.down(320, 310); t.up(320, 310);
  check('tocar na seleção sem mover não cria passo de desfazer', app.history.depth === depth);
  const ok = pointer(wet);
  ok.down(320, 310); ok.move(420, 410, 1); ok.up(420, 410);
  check('mover de verdade cria um passo de desfazer', app.history.depth === depth + 1 && all(app)[0].pts[0] !== x0);
  app.undo();
  check('desfazer o mover volta ao lugar', all(app)[0].pts[0] === x0);
  // 2 dedos cancelados no meio de um giro
  app.selection = null; app.onSelectionChange();
  app.tool = 'lasso';
  const l2 = pointer(wet);
  l2.down(250, 250);
  for (const [x, y] of [[450, 250], [450, 400], [250, 400], [250, 260]]) l2.move(x, y, 1);
  l2.up(250, 260);
  app.tool = 'brush';
  const d2 = app.history.depth;
  const fa = pointer(wet, 'touch'), fb = pointer(wet, 'touch');
  fa.down(300, 320); fb.down(400, 330); fb.move(380, 420); fb.move(360, 450);
  fa.cancel(300, 320); fb.cancel(360, 450);
  check('giro com 2 dedos cancelado volta ao lugar', all(app)[0].pts[0] === x0 && app.history.depth === d2);
}

// ---------- correções da revisão (24/11) ----------
{
  // seleção some no meio de um giro com 2 dedos: não pode quebrar nem travar os gestos
  const { app, wet } = makeApp();
  stroke(wet, 300, 300);
  app.tool = 'lasso';
  const l = pointer(wet);
  l.down(250, 250);
  for (const [x, y] of [[450, 250], [450, 400], [250, 400], [250, 260]]) l.move(x, y, 1);
  l.up(250, 260);
  app.tool = 'brush';
  const original = app.history.undoStack.at(-1)?.after[0];
  const fa = pointer(wet, 'touch'), fb = pointer(wet, 'touch');
  fa.down(300, 320); fb.down(400, 330); fb.move(380, 380);
  let threw = false;
  try {
    app.undo();                                   // desfazer pela roda no meio do giro: o frame é trocado
    fb.move(360, 450); fa.up(300, 320); fb.up(360, 450);
  } catch (err) { threw = String(err); }
  check('desfazer no meio do giro não quebra', threw === false, threw);
  check('desfazer no meio do giro: o giro morre sem gravar passo falso', app.history.canRedo && all(app).length === 0);
  check('desfazer no meio do giro não mexe nos traços do histórico', !original || Math.abs(original.pts[0] - (300 / W) * 1200) < 1e-6);
  stroke(wet, 600, 200);
  const n = all(app).length;
  const ta = pointer(wet, 'touch'), tb = pointer(wet, 'touch');
  ta.down(500, 400); tb.down(800, 400); ta.up(500, 400); tb.up(800, 400);
  check('depois disso, o toque de 2 dedos ainda desfaz', all(app).length === n - 1);
}
{
  // botão 2 que o Android trata como "borracha": o contato chega como buttons = 32, sem o bit da ponta
  const { app, wet } = makeApp();
  stroke(wet, 300, 300);
  const pen = pointer(wet);
  pen.down(250, 250, 32, 5);
  for (const [x, y] of [[450, 250], [450, 400], [250, 400], [250, 260]]) pen.move(x, y, 32, 0.5);
  pen.up(250, 260, 0, 5);
  check('botão 2 como borracha (32) faz laço', app.selection?.ids.size === 1 && all(app).length === 1);
  check('soltar o botão 2 (32) solta o Laço', !app.lassoHeld);
}
{
  // gravando vídeo: papel e roda não recebem nada
  const { app, wet } = makeApp();
  app.recording = true;
  stroke(wet, 300, 300);
  tap(wet, ...BTN);
  check('gravando: caneta não desenha e a roda não abre', all(app).length === 0 && !app.ui.isOpen);
}
{
  // paredes do balde em outra tinta
  const { wallsFor, fillDependents } = await import('../src/doc/project.js');
  const p = newProject();
  check('paredes: mesma duração = mesmo frame nas outras tintas', JSON.stringify(wallsFor(p, 1, 3)) === JSON.stringify([{ l: 0, f: 3 }, { l: 2, f: 3 }, { l: 3, f: 3 }]));
  p.layers[0].fps = 12; p.layers[0].frames = Array.from({ length: 12 }, () => []);
  check('paredes: tinta a 12 fps acompanha o tempo do frame', wallsFor(p, 1, 2).find((w) => w.l === 0).f === 3);
  p.layers[1].frames[2].push({ id: 1, kind: 'fill', w: 1, pts: [5, 5, 1] });
  check('balde na tinta 2 depende da linha da tinta 1 no mesmo tempo', JSON.stringify(fillDependents(p, 0, 3)) === JSON.stringify([{ l: 1, f: 2 }]));
  check('frame sem relação não tem dependentes', fillDependents(p, 0, 7).length === 0);
}
{
  // agenda de máscaras: limite de tempo, dependentes, giro com balde, mudança de FPS
  const { rebuildDirty } = await import('../src/schedule.js');
  const built = [];
  const app = { project: newProject(), dirty: new Set(), masks: { rebuild: (l, f) => built.push(`${l}:${f}`) }, input: { transforming: false } };
  const P = app.project;
  P.layers[0].frames[0].push({ id: 1, kind: 'ink', w: 5, pts: [1, 1, 1] });
  P.layers[1].frames[0].push({ id: 2, kind: 'fill', w: 1, pts: [5, 5, 1] });
  rebuildDirty(app, 0);
  app.dirty.add('0:0');
  rebuildDirty(app, 1000);
  check('linha mudou: o balde da outra tinta é refeito junto', built.includes('0:0') && built.includes('1:0'), built.join(' '));
  built.length = 0;
  let fake = 0;
  for (let f = 0; f < 8; f++) { P.layers[2].frames[f].push({ id: 10 + f, kind: 'ink', w: 5, pts: [1, 1, 1] }); app.dirty.add(`2:${f}`); }
  rebuildDirty(app, 2000, () => (fake += 5));      // cada máscara "custa" 5 ms
  check('limite por quadro: não refaz tudo de uma vez', built.length > 0 && built.length < 8 && app.dirty.size > 0, built.length);
  while (app.dirty.size) rebuildDirty(app, 2000, () => (fake += 5));
  check('o resto é refeito nos quadros seguintes', [0, 1, 2, 3, 4, 5, 6, 7].every((f) => built.includes(`2:${f}`)) && !app.dirty.size);
  built.length = 0;
  app.input.transforming = true;
  app.dirty.add('1:0'); rebuildDirty(app, 3000);
  app.dirty.add('1:0'); rebuildDirty(app, 3050);
  check('girando um frame com balde: no máximo a cada 120 ms', built.length === 1 && app.dirty.has('1:0'));
  app.input.transforming = false;
  rebuildDirty(app, 3060);
  check('soltou: o frame com balde é refeito', built.length === 2 && !app.dirty.size);
  built.length = 0;
  P.layers[0].fps = 12;
  rebuildDirty(app, 4000);
  check('mudou o FPS: frames com balde são refeitos', built.includes('1:0'), built.join(' '));
}

// ---------- zoom e mover o papel (T-020) ----------
{
  const v = createView();
  const d = uvToDoc(v, 0.25, 0.5);
  check('sem zoom: uv 0,25 = x 300', Math.abs(d.x - 300) < 1e-9 && Math.abs(d.y - 400) < 1e-9);
  pinch(v, { view: createView(), mid: { u: 0.5, w: 0.5 }, dist: 0.1 }, { mid: { u: 0.5, w: 0.5 }, dist: 0.2 });
  check('pinça dobra o zoom', v.s === 2, v.s);
  const c = uvToDoc(v, 0.5, 0.5);
  check('o ponto sob os dedos fica no lugar', Math.abs(c.x - 600) < 1e-9 && Math.abs(c.y - 400) < 1e-9);
  const back = docToUv(v, 600, 400);
  check('ida e volta documento/tela', Math.abs(back.u - 0.5) < 1e-9 && Math.abs(back.w - 0.5) < 1e-9);
  pinch(v, { view: createView(), mid: { u: 0.5, w: 0.5 }, dist: 0.1 }, { mid: { u: 0.5, w: 0.5 }, dist: 9 });
  check('zoom máximo 400%', v.s === 4);
  pinch(v, { view: { s: 2, ox: -0.5, oy: -0.5 }, mid: { u: 0.5, w: 0.5 }, dist: 0.1 }, { mid: { u: 3, w: 3 }, dist: 0.1 });
  check('arrastar não deixa o papel sair da tela', v.ox <= 0 && v.ox >= 1 - v.s && v.oy <= 0 && v.oy >= 1 - v.s);
  const near = { s: 1.05, ox: -0.02, oy: -0.01 };
  settle(near);
  check('soltar perto de 100% encaixa', near.s === 1 && near.ox === 0 && near.oy === 0);
  const far = { s: 1.5, ox: -0.2, oy: -0.1 };
  settle(far);
  check('longe de 100% fica onde está', far.s === 1.5);
}
{
  const { app, wet } = makeApp();
  // pinça com 2 dedos fora da seleção: zoom 2x no meio da tela
  const a = pointer(wet, 'touch'), b = pointer(wet, 'touch');
  a.down(490, 360); b.down(590, 360);
  a.move(440, 360); b.move(640, 360);
  a.up(440, 360); b.up(640, 360);
  check('pinça de 2 dedos dá zoom', Math.abs(app.view.s - 2) < 0.02, app.view.s.toFixed(3));
  check('pinça não desfaz', app.history.depth === 0);
  // desenhar com zoom: o traço cai no lugar certo do papel
  const pen = pointer(wet);
  pen.down(540, 360); pen.move(550, 360, 1); pen.up(550, 360);
  const s0 = all(app)[0];
  const expect = uvToDoc(app.view, 540 / W, 360 / H);
  check('com zoom, a caneta desenha no ponto certo do papel', Math.abs(s0.pts[0] - expect.x) < 1e-6 && Math.abs(s0.pts[1] - expect.y) < 1e-6);
  check('com zoom, 10 px de caneta andam 10 px divididos pelo zoom no papel', Math.abs(s0.pts[3] - s0.pts[0] - 10 * 1200 / W / app.view.s) < 1e-6);
  // toque rápido de 2 dedos continua desfazendo, mesmo com zoom
  const c = pointer(wet, 'touch'), d = pointer(wet, 'touch');
  c.down(300, 300); d.down(600, 300); c.up(300, 300); d.up(600, 300);
  check('toque rápido de 2 dedos ainda desfaz com zoom', all(app).length === 0);
  // 2 dedos sobre a seleção giram a seleção e não mexem no zoom
  stroke(wet, 400, 300);
  app.tool = 'lasso';
  const l = pointer(wet);
  l.down(350, 250);
  for (const [x, y] of [[560, 250], [560, 420], [350, 420], [350, 260]]) l.move(x, y, 1);
  l.up(350, 260);
  app.tool = 'brush';
  const zoomBefore = app.view.s;
  const e = pointer(wet, 'touch'), f = pointer(wet, 'touch');
  e.down(420, 320); f.down(500, 330); f.move(520, 400); e.up(420, 320); f.up(520, 400);
  check('2 dedos sobre a seleção não mudam o zoom', app.view.s === zoomBefore && app.history.depth === 2);
  fitView(app.view);
}

// ---------- pincéis (T-021) e suavização (T-025) ----------
{
  const { app, wet } = makeApp();
  const toolAt = (k) => at(218, -45 - 17 * 1.5 + 17 * k);   // arco Riscar: Pincel, Lápis, Marcador, Giz
  const pick = (k) => { app.ui.collapse(); tap(wet, ...BTN); tap(wet, ...at(58, 0)); tap(wet, ...toolAt(k)); app.ui.collapse(); };
  pick(1);
  check('pétala: Lápis', app.tool === 'pencil');
  stroke(wet, 200, 200);
  const s1 = all(app).at(-1);
  check('traço de Lápis guarda o pincel e o tamanho do Lápis', s1.b === 'pencil' && s1.w === app.project.settings.sizes.pencil);
  pick(2); stroke(wet, 200, 300);
  check('traço de Marcador', all(app).at(-1).b === 'marker' && all(app).at(-1).w === 16);
  pick(3); stroke(wet, 200, 400);
  check('traço de Giz', all(app).at(-1).b === 'chalk');
  pick(0); stroke(wet, 200, 500);
  check('Pincel comum não grava "b" (arquivo menor)', !('b' in all(app).at(-1)));
  // botão 1 da caneta: Giz → Borracha → volta ao Giz
  pick(3);
  const pen = pointer(wet);
  pen.down(600, 300, 2, 2); pen.up(600, 300, 0, 2);
  check('botão 1 vai do Giz para a Borracha', app.tool === 'eraser');
  stroke(wet, 600, 300);
  check('borracha usa o tamanho dela', all(app).at(-1).kind === 'cut' && all(app).at(-1).w === app.project.settings.sizes.eraser);
  const pen2 = pointer(wet);
  pen2.down(600, 300, 2, 2); pen2.up(600, 300, 0, 2);
  check('botão 1 de novo volta ao Giz (último pincel)', app.tool === 'chalk');
  // arco de Tamanho mexe só na ferramenta atual
  app.ui.collapse(); tap(wet, ...BTN); tap(wet, ...at(58, 0));
  const before = { ...app.project.settings.sizes };
  const sz = pointer(wet, 'touch');
  sz.down(...at(354, -45 + 30)); sz.up(...at(354, -45 + 30));
  check('arco de Tamanho muda só o Giz', app.project.settings.sizes.chalk === 40 && app.project.settings.sizes.brush === before.brush);
  // projeto antigo com um tamanho só
  const old = JSON.parse(JSON.stringify(app.project));
  delete old.settings.sizes; old.settings.brush = 22;
  const { sanitize } = await import('../src/doc/project.js');
  const m = sanitize(old).settings.sizes;
  check('projeto da 0.3.0 abre com o tamanho antigo no Pincel e na Borracha', m.brush === 22 && m.eraser === 22 && m.pencil === 6);
  const bad = JSON.parse(JSON.stringify(app.project));
  bad.layers[0].frames[0].push({ id: 999, kind: 'ink', b: 'aquarela', w: 5, pts: [1, 2, 0.5] });
  check('pincel desconhecido no arquivo vira Pincel comum', !('b' in sanitize(bad).layers[0].frames[0].at(-1)));
}
{
  // o Giz sai igual na tela (segmento a segmento) e na máscara (traço inteiro)
  const { drawStroke, drawLastSegment, widthAt, BRUSHES } = await import('../src/render/stroke.js');
  const rec = () => { const calls = []; return { calls, ctx: new Proxy({}, { get: (t, k) => (k in t ? t[k] : (...a) => calls.push([k, ...a.map((x) => (typeof x === 'number' ? Math.round(x * 1000) : x))])), set: (t, k, v) => { t[k] = v; return true; } }) }; };
  const s = { id: 42, kind: 'ink', b: 'chalk', w: 14, pts: [] };
  const wetRec = rec();
  for (let i = 0; i < 8; i++) { s.pts.push(100 + i * 9, 200 + (i % 3) * 4, 0.4 + i * 0.05); drawLastSegment(wetRec.ctx, s, '#f0f'); }
  const maskRec = rec();
  drawStroke(maskRec.ctx, s, 1, null, true);
  const arcs = (r) => JSON.stringify(r.calls.filter((c) => c[0] === 'arc'));
  check('Giz: tela e máscara desenham os mesmos carimbos', arcs(wetRec) === arcs(maskRec) && wetRec.calls.some((c) => c[0] === 'arc'));
  check('Marcador ignora a pressão', widthAt(16, 0.1, BRUSHES.marker) === widthAt(16, 1, BRUSHES.marker));
  check('Lápis é mais fino que o Pincel', widthAt(10, 1, BRUSHES.pencil) < widthAt(10, 1, BRUSHES.brush));
}
{
  // suavização: desligada por padrão; ligada, o traço fica liso e termina no ponto real da caneta
  const { app, wet } = makeApp();
  const zig = (p) => { p.down(200, 300); for (let i = 1; i <= 30; i++) p.move(200 + i * 10, 300 + (i % 2 ? 20 : -20), 1); p.up(500, 300 - 20); };
  zig(pointer(wet));
  const raw = all(app).at(-1).pts;
  check('sem suavização, o traço passa pelos pontos da caneta', Math.abs(raw[4] - (320 * 1200 / W)) < 1e-6);
  app.project.settings.smooth = 1;
  zig(pointer(wet));
  const sm = all(app).at(-1).pts;
  const spread = (p) => { let lo = 1e9, hi = -1e9; for (let i = 30; i < p.length - 3; i += 3) { lo = Math.min(lo, p[i + 1]); hi = Math.max(hi, p[i + 1]); } return hi - lo; };
  check('com suavização, o zigue-zague fica bem menor', spread(sm) < spread(raw) * 0.5, `${spread(sm).toFixed(1)} < ${spread(raw).toFixed(1)}`);
  check('com suavização, o traço termina onde a caneta parou', Math.abs(sm.at(-3) - 500 * 1200 / W) < 1e-6, `${sm.at(-3)} ${sm.at(-2)} n=${sm.length}`);
}

// ---------- máquina de gestos (ADR-003, #022–#024) ----------
{
  const { createGestures } = await import('../src/input/gestures.js');
  const G = () => createGestures();
  const t = { id: 0 };
  const two = (g, a, b, ctx = {}, t0 = 0) => [...g.down({ id: 1, x: a[0], y: a[1], t: t0 }, ctx), ...g.down({ id: 2, x: b[0], y: b[1], t: t0 }, ctx)];
  const types = (acts) => acts.map((x) => x.type).join(',');
  // os dois dedos andam juntos (dx, dy) em passos de ~4 px, um dedo de cada vez; devolve todas as ações
  const pos = { 1: null, 2: null };
  const place = (a, b) => { pos[1] = [...a]; pos[2] = [...b]; };
  const walk = (g, dx, dy, ctx = {}) => {
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
    const acts = [];
    for (let i = 0; i < n; i++) for (const id of [1, 2]) {
      pos[id][0] += dx / n; pos[id][1] += dy / n;
      acts.push(...g.move({ id, x: pos[id][0], y: pos[id][1], t: 50 + i }, ctx));
    }
    return acts;
  };
  // DESFAZER
  let g = G(); two(g, [100, 100], [300, 100]);
  let out = [...g.up(1, 100), ...g.up(2, 120)];
  check('máquina: toque rápido = desfazer', types(out) === 'undo', types(out));
  // TRANSFORMAR
  g = G();
  out = two(g, [100, 100], [300, 100], { overSelection: () => true });
  check('máquina: sobre a seleção = transformar já ao pousar', types(out) === 'xf-begin' && g.intent === 'xf');
  out = g.move({ id: 2, x: 320, y: 140, t: 50 }, {});
  check('máquina: transformar segue os dedos', types(out) === 'xf');
  out = [...g.up(1, 400), ...g.up(2, 400)];
  check('máquina: fim do transformar', out[0].type === 'end' && out[0].intent === 'xf' && out[0].moved > 12);
  // PAPEL por pinça
  g = G(); two(g, [100, 100], [300, 100], { fit: true });
  out = g.move({ id: 2, x: 330, y: 100, t: 50 }, { fit: true });     // distância +15%
  check('máquina: distância mudou 10% = papel (zoom)', types(out) === 'pan-begin,pan' && g.intent === 'pan');
  // TEMPO
  g = G(); place([100, 300], [300, 300]); two(g, pos[1], pos[2], { fit: true });
  out = walk(g, 26, 2, { fit: true });
  check('máquina: andaram juntos na horizontal com o papel em 100% = tempo', g.intent === 'time' && out[0]?.type === 'time-begin', types(out));
  out = walk(g, 24, 0);
  check('máquina: 48 px = 1 frame para a frente', out.filter((x) => x.type === 'scrub').reduce((n, x) => n + x.frames, 0) === 1, JSON.stringify(out));
  out = walk(g, 200, 0);
  check('máquina: movimento rápido anda vários frames', out.filter((x) => x.type === 'scrub').reduce((n, x) => n + x.frames, 0) === 4, JSON.stringify(out));
  out = walk(g, -330, 0);
  check('máquina: para a esquerda volta', out.some((x) => x.type === 'scrub' && x.frames < 0));
  out = [...g.up(1, 200, true), ...g.up(2, 200)];
  check('máquina: cancelado devolve quantos frames andou', out[0].type === 'cancel' && out[0].intent === 'time' && out[0].frames === -1, JSON.stringify(out));
  // com zoom, arrastar = papel
  g = G(); place([100, 300], [300, 300]); two(g, pos[1], pos[2], { fit: false });
  out = walk(g, 30, 0, { fit: false });
  check('máquina: com zoom, arrastar = mover o papel', g.intent === 'pan' && out[0]?.type === 'pan-begin');
  // em 100%, arrastar na vertical não é tempo
  g = G(); place([100, 300], [300, 300]); two(g, pos[1], pos[2], { fit: true });
  walk(g, 2, 30, { fit: true });
  check('máquina: arrastar na vertical não anda no tempo', g.intent === 'pan');
  // pinça com um dedo parado (polegar fixo) também é pinça
  g = G(); place([100, 300], [300, 300]); two(g, pos[1], pos[2], { fit: true });
  for (let i = 1; i <= 10; i++) g.move({ id: 2, x: 300 + i * 4, y: 300, t: 50 + i }, { fit: true });
  check('máquina: abrir com um dedo parado = pinça', g.intent === 'pan');
  // a intenção não muda no meio
  g = G(); place([100, 300], [300, 300]); two(g, pos[1], pos[2], { fit: true });
  walk(g, 26, 0, { fit: true });
  g.move({ id: 2, x: 700, y: 300, t: 70 }, { fit: true });                        // vira "pinça" no meio
  check('máquina: decidiu tempo, continua tempo até soltar', g.intent === 'time');
  // PALMA
  g = G();
  g.penEvent(1000, true);
  out = g.down({ id: 1, x: 100, y: 100, t: 1000 }, {});
  check('palma: toque com a caneta encostada é ignorado', types(out) === 'ignored');
  g.penGone(1100);
  out = g.down({ id: 2, x: 300, y: 100, t: 1300 }, {});
  check('palma: toque até 300 ms depois da caneta é ignorado', types(out) === 'ignored');
  out = g.down({ id: 3, x: 300, y: 100, t: 1500 }, {});
  check('palma: depois de 300 ms vale', types(out) === '' && !g.active);
  check('palma: toque ignorado continua ignorado (não forma gesto com o novo)', !g.active);
  g = G(); g.penEvent(0, false);                                                   // pairando
  check('palma: caneta pairando ignora toques', types(g.down({ id: 1, x: 1, y: 1, t: 500 }, {})) === 'ignored');
  g = G();
  check('palma: contato largo (> 40 px) é ignorado', types(g.down({ id: 1, x: 1, y: 1, t: 0, w: 60, h: 30 }, {})) === 'ignored');
  check('palma: conta os ignorados para o painel', g.stats.ignored === 1 && g.stats.lastW === 60);
}
{
  // TEMPO no app: segura o loop, anda na tinta ativa, a régua aparece; cancelado volta
  const { app, wet } = makeApp();
  app.clock.paused = false; app.clock.t = 0;
  let ruler = null;
  app.ui.ruler = (on) => { ruler = on; };
  const a = pointer(wet, 'touch'), b = pointer(wet, 'touch');
  a.down(300, 400); b.down(500, 400);
  for (let x = 4; x <= 32; x += 4) { a.move(300 + x, 401); b.move(500 + x, 401); }
  check('tempo: segura o loop durante o gesto', app.clock.holds.has('scrub') && ruler === true);
  for (let x = 36; x <= 100; x += 4) { a.move(300 + x, 402); b.move(500 + x, 402); }
  check('tempo: 100 px para a direita = 2 frames', app.clock.frameOf(app.project.layers[0]) === 2, app.clock.frameOf(app.project.layers[0]));
  a.up(400, 402); b.up(600, 402);
  check('tempo: soltar solta o loop e esconde a régua', !app.clock.holds.has('scrub') && ruler === false);
  check('tempo: não desfaz nem mexe no zoom', app.history.depth === 0 && app.view.s === 1);
  app.clock.t = 0;
  const c = pointer(wet, 'touch'), d = pointer(wet, 'touch');
  c.down(300, 400); d.down(500, 400);
  for (let x = 4; x <= 100; x += 4) { c.move(300 + x, 401); d.move(500 + x, 401); }
  c.cancel(400, 401); d.cancel(600, 401);
  check('tempo: cancelado volta ao frame de antes', app.clock.frameOf(app.project.layers[0]) === 0 && !app.clock.holds.has('scrub'));
}
{
  // palma no app: desenhando, um toque da palma não vira gesto
  const { app, wet } = makeApp();
  wet.autoPenAway = false;
  stroke(wet, 300, 300);
  const pa = pointer(wet, 'touch'), pb = pointer(wet, 'touch');
  pa.down(500, 400); pb.down(700, 400); pa.up(500, 400); pb.up(700, 400);
  check('palma logo depois do traço não desfaz', all(app).length === 1 && app.input.gestures.stats.ignored === 2);
  // a roda continua respondendo com a caneta perto
  const pen = pointer(wet); pen.move(600, 300, 0);
  tap(wet, ...BTN);
  check('a roda responde mesmo com a caneta pairando', app.ui.isOpen);
}

// ---------- 0.3.2: dois arcos, Vermelho vivo ----------
{
  const { app, wet } = makeApp();
  tap(wet, ...BTN); tap(wet, ...at(58, 0));
  tap(wet, ...at(282, -45));
  check('arco Mexer: Balde em 2 toques', app.tool === 'bucket');
  app.ui.collapse(); tap(wet, ...BTN); tap(wet, ...at(58, 0));
  tap(wet, ...at(282, -45 + 17));
  check('arco Mexer: Laço', app.tool === 'lasso');
  app.ui.collapse(); tap(wet, ...BTN); tap(wet, ...at(58, 0));
  tap(wet, ...at(218, -45 + 17 * 1.5));
  check('arco Riscar: Giz', app.tool === 'chalk');
  const { INKS } = await import('../src/config.js');
  check('paleta com 9 tintas, Vermelho vivo no fim', INKS.length === 9 && INKS[8].name === 'Vermelho vivo' && INKS[8].hex === '#F15060');
  app.ui.collapse(); tap(wet, ...BTN); tap(wet, ...at(58, 180));
  tap(wet, ...at(282, -45 - (14 * 8) / 2 + 14 * 8));
  check('Vermelho vivo escolhível no arco de cores', app.project.inks[0] === 8);
  const { projectToText, projectFromText } = await import('../src/io/file.js');
  check('Vermelho vivo (índice 8) salva e abre no .grao', projectFromText(projectToText(app.project)).inks[0] === 8);
  const bad = JSON.parse(projectToText(app.project)); bad.inks[0] = 9;
  check('índice 9 não existe: volta ao padrão', projectFromText(JSON.stringify(bad)).inks[0] === 0);
}

// ---------- v0.4: camadas e tintas (#028–#031) ----------
{
  const { sanitize, newProject: np, MAX_LAYERS } = await import('../src/doc/project.js');
  // migração da versão 1 (camada = tinta, layer.ink era a cor)
  const v1 = { format: 'grao-projeto', version: 1, paper: 'kraft', nextId: 5, activeLayer: 2,
    layers: [0, 1, 6, 3].map((ink, l) => ({ ink, fps: 8, frames: [[{ id: l + 1, kind: 'ink', w: 5, pts: [1, 2, 0.5] }], []] })),
    settings: { grain: 0.4 } };
  const m = sanitize(v1);
  check('migração: projeto antigo vira 4 camadas, uma por tambor', m.version === 2 && m.layers.length === 4 && m.layers.map((L) => L.ink).join() === '0,1,2,3');
  check('migração: as cores vão para os tambores (sem mudança visual)', m.inks.join() === '0,1,6,3');
  check('migração: traços, ativa e ajustes preservados', m.layers[2].frames[0][0].id === 3 && m.activeLayer === 2 && m.settings.grain === 0.4);
  check('migração: camadas visíveis, destravadas, retícula estocástica 100%',
    m.layers.every((L) => L.visible && !L.locked && L.screen.type === 'stochastic' && L.screen.density === 1));
  check('migração: cada camada tem id único', new Set(m.layers.map((L) => L.id)).size === 4);
  // limites
  const many = np(); many.layers = Array.from({ length: 11 }, (_, i) => ({ ...many.layers[0], id: i + 1, ink: 7 }));
  const lim = sanitize(JSON.parse(JSON.stringify(many)));
  check('arquivo com 11 camadas abre com 8; tambor inválido volta a um válido', lim.layers.length === MAX_LAYERS && lim.layers.every((L) => L.ink >= 0 && L.ink < 4));
  const dupIds = np(); dupIds.layers[1].id = dupIds.layers[0].id;
  check('ids repetidos no arquivo são corrigidos', new Set(sanitize(JSON.parse(JSON.stringify(dupIds))).layers.map((L) => L.id)).size === 4);
  const scr = np(); scr.layers[0].screen = { type: 'am', density: 0.01 }; scr.layers[1].screen = { type: 'xadrez', density: 9 };
  const sc = sanitize(JSON.parse(JSON.stringify(scr)));
  check('retícula: densidade mínima 5% e tipo inválido vira estocástica', sc.layers[0].screen.type === 'am' && sc.layers[0].screen.density === 0.05 && sc.layers[1].screen.type === 'stochastic' && sc.layers[1].screen.density === 1);
}
{
  const { app, wet } = makeApp();
  const P = () => app.project;
  stroke(wet, 300, 300);
  // criar camada: acima da ativa, mesma tinta e tempo
  app.addLayer();
  check('criar camada: fica acima da ativa e vira a ativa', P().layers.length === 5 && P().activeLayer === 1 && P().layers[1].ink === P().layers[0].ink);
  stroke(wet, 400, 200);
  check('a camada nova recebe o traço', P().layers[1].frames.flat().length === 1);
  check('desfazer o traço não desfaz a camada', app.undo() && P().layers.length === 5 && P().layers[1].frames.flat().length === 0);
  check('desfazer de novo apaga a camada criada', app.undo() && P().layers.length === 4);
  check('refazer recria a camada', app.redo() && P().layers.length === 5);
  for (let i = 0; i < 5; i++) app.addLayer();
  check('máximo de 8 camadas', P().layers.length === 8 && toasts.at(-1) === 'Máximo de 8 camadas.');
  // reordenar
  const id0 = P().layers[0].id;
  P().activeLayer = 0;
  app.moveLayer(0, +1);
  check('subir a camada troca a ordem e a ativa acompanha', P().layers[1].id === id0 && P().activeLayer === 1);
  app.undo();
  check('desfazer volta a ordem', P().layers[0].id === id0);
  // visível, travar, tinta, retícula
  app.toggleLayerVisible(0);
  check('esconder camada', P().layers[0].visible === false);
  app.toggleLayerLock(0); P().activeLayer = 0;
  const n0 = all(app).length;
  stroke(wet, 500, 300);
  check('camada travada não aceita traço', all(app).length === n0);
  app.tool = 'bucket'; tap(wet, 500, 300, 'pen'); app.tool = 'brush';
  check('camada travada não aceita balde', all(app).length === n0);
  app.setLayerInk(0, 3);
  check('trocar o tambor da camada', P().layers[0].ink === 3);
  app.setLayerScreen(0, { type: 'am', density: 0.3 });
  check('retícula reticulada 30%', P().layers[0].screen.type === 'am' && P().layers[0].screen.density === 0.3);
  app.undo(); app.undo(); app.undo(); app.undo();
  check('desfazer volta retícula, tambor, trava e visível', P().layers[0].screen.type === 'stochastic' && P().layers[0].ink === 0 && !P().layers[0].locked && P().layers[0].visible);
  // duplicar e apagar
  P().activeLayer = 0;
  while (P().layers.length > 4) app.deleteLayer(P().layers.length - 1);
  app.duplicateLayer(0);
  const dup = P().layers[1];
  check('duplicar camada copia os traços com ids novos', dup.frames.flat().length === P().layers[0].frames.flat().length && dup.frames.flat()[0].id !== P().layers[0].frames.flat()[0].id && dup.id !== P().layers[0].id);
  app.deleteLayer(1);
  check('apagar camada', P().layers.length === 4 && P().layers.every((L) => L.id !== dup.id));
  while (P().layers.length > 1) app.deleteLayer(0);
  app.deleteLayer(0);
  check('a última camada não pode ser apagada', P().layers.length === 1 && toasts.at(-1) === 'A última camada não pode ser apagada.');
}
{
  // cor do tambor e tintas prontas
  const { app } = makeApp();
  const { FALSE_CMYK } = await import('../src/actions.js');
  app.setDrumColor(2, 5);
  check('cor do tambor muda para todas as camadas dele', app.project.inks[2] === 5);
  const before = app.project.inks.slice();
  app.applyFalseCmyk();
  check('Falso CMYK: Azul, Vermelho vivo, Amarelo, Preto', app.project.inks.join() === FALSE_CMYK.join() && FALSE_CMYK.join() === '1,8,2,3');
  app.restoreProjectInks();
  check('"Do projeto" volta às tintas de antes', app.project.inks.join() === before.join());
  app.applyFalseCmyk(); app.undo();
  check('Falso CMYK entra no desfazer', app.project.inks.join() === before.join());
  // leitura com mais de 4 camadas
  app.clock.t = 0;
  check('leitura com 4 camadas: 1/8', app.frameLabel() === '1/8');
  app.addLayer();
  check('leitura com mais de 4 camadas: C2 · 1/8', app.frameLabel() === 'C2 · 1/8', app.frameLabel());
}
{
  // máscaras guardadas pelo id da camada; trapping no balde
  const { floodFill } = await import('../src/render/fill.js');
  const w = 40, h = 20;
  const img = new Uint8ClampedArray(w * h * 4);
  const wall = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (const x of [10, 11, 12, 13, 14, 15]) wall[y * w + x] = 1;     // linha grossa de outra camada
  const a = img.slice(); floodFill(a, w, h, 3, 10, 2, wall, 0);
  const b = img.slice(); floodFill(b, w, h, 3, 10, 2, wall, 2);
  const px = (d, x) => d[(10 * w + x) * 4];
  check('trapping: sem ele o balde entra 1 px na linha; com ele, mais 2 px (0,5 mm)', px(a, 10) === 255 && px(a, 11) === 0 && px(b, 12) === 255 && px(b, 13) === 0);
  check('trapping: nunca passa para o outro lado da linha', px(b, 17) === 0 && px(b, 25) === 0);
}

// ---------- abrir sem internet (#035) ----------
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const { VERSION, BUILD } = await import('../src/config.js');
  const ver = /const VERSION = '([^']+)'/.exec(sw)?.[1];
  check('sw.js tem a mesma versão do app (senão o tablet não recebe a atualização)', ver === `${VERSION}-${BUILD}`, `${ver} vs ${VERSION}-${BUILD}`);
  const listed = new Set([...sw.matchAll(/^\s*'([^']+)',$/gm)].map((m) => m[1]));
  const walk = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap((f) =>
    f.isDirectory() ? walk(`${d}/${f.name}`) : /\.(js|vert|frag)$/.test(f.name) ? [`${d}/${f.name}`] : []);
  const missing = walk('src').filter((f) => !listed.has(f));
  check('sw.js guarda todos os arquivos do app', !missing.length && ['index.html', 'styles.css', 'manifest.webmanifest'].every((f) => listed.has(f)), missing.join(', '));
  const extra = [...listed].filter((f) => f !== './' && !fs.existsSync(path.join(root, f)));
  check('sw.js não lista arquivo que não existe (a instalação falharia inteira)', !extra.length, extra.join(', '));
}

// ---------- v0.5: tempo (#036–#041) ----------
{
  const { layerTicks, frameAtTick, frameStartTick, wallsFor, sanitize: san } = await import('../src/doc/project.js');
  const { app, wet } = makeApp();
  const layer = app.project.layers[0];
  // exposição
  app.clock.t = 0;
  app.setExpo(3);                                    // frame 1 fica 3 tempos
  check('exposição: loop com 8 frames e um ×3 tem 10 tempos', layerTicks(layer) === 10 && layer.expo[0] === 3);
  check('exposição: tempos 0,1,2 mostram o frame 1; o 3 mostra o frame 2', frameAtTick(layer, 2) === 0 && frameAtTick(layer, 3) === 1);
  app.clock.t = 0;
  app.clock.step(layer, 1);
  check('exposição: avançar pula o frame inteiro (3 tempos)', app.clock.frameOf(layer) === 1 && Math.floor(app.clock.t * 8 + 1e-6) === 3);
  app.clock.step(layer, -1);
  check('exposição: voltar volta ao começo do frame longo', app.clock.frameOf(layer) === 0 && Math.floor(app.clock.t * 8 + 1e-6) === 0);
  app.clock.step(layer, -1);
  check('exposição: voltar do frame 1 vai ao último', app.clock.frameOf(layer) === 7);
  const { loopSeconds } = await import('../src/io/video.js');
  layer.frames[0].push({ id: 900, kind: 'ink', w: 5, pts: [1, 1, 1] });
  check('exposição: o vídeo conta os tempos a mais', loopSeconds(app.project) === 10 / 8 * 1 || loopSeconds(app.project) === 1.25, loopSeconds(app.project));
  layer.frames[0].pop();
  check('exposição: paredes do balde seguem o tempo com exposição', wallsFor(app.project, 1, 1).find((w) => w.l === 0).f === 0);
  check('exposição salva e abre no .grao', san(JSON.parse(JSON.stringify(app.project))).layers[0].expo?.[0] === 3);
  app.undo();
  check('desfazer a exposição', !layer.expo && layerTicks(layer) === 8);
}
{
  const { app, wet } = makeApp();
  const L0 = () => app.project.layers[0];
  app.project.settings.auto = false;
  app.clock.paused = true; app.clock.t = 0;
  stroke(wet, 300, 300);                              // frame 1
  const id1 = L0().frames[0][0].id;
  app.duplicateFrame();
  check('duplicar frame: cópia com ids novos logo depois, e vai para ela', L0().frames.length === 9 && L0().frames[1][0].id !== id1 && app.clock.frameOf(L0()) === 1);
  app.insertFrame();
  check('inserir frame vazio depois do atual', L0().frames.length === 10 && L0().frames[2].length === 0 && app.clock.frameOf(L0()) === 2);
  app.moveFrame(-1);
  check('mover frame para trás', L0().frames[1].length === 0 && L0().frames[2].length === 1 && app.clock.frameOf(L0()) === 1);
  app.deleteFrame();
  check('apagar frame', L0().frames.length === 9 && L0().frames[1].length === 1);
  app.undo(); app.undo(); app.undo(); app.undo();
  check('desfazer as 4 operações volta ao começo', L0().frames.length === 8 && L0().frames[0][0].id === id1 && L0().frames[1].length === 0);
  for (let i = 0; i < 6; i++) app.insertFrame();
  check('máximo de 12 frames ao inserir', L0().frames.length === 12 && toasts.at(-1) === 'Máximo de 12 frames por camada.');
  while (L0().frames.length > 1) app.deleteFrame();
  app.deleteFrame();
  check('a camada fica com pelo menos 1 frame', L0().frames.length === 1 && toasts.at(-1) === 'A camada precisa de pelo menos 1 frame.');
}
{
  // copiar e colar entre frames e camadas
  const { app, wet } = makeApp();
  app.project.settings.auto = false;
  app.clock.paused = true; app.clock.t = 0;
  stroke(wet, 300, 300);
  app.tool = 'lasso';
  const l = pointer(wet);
  l.down(250, 250);
  for (const [x, y] of [[450, 250], [450, 400], [250, 400], [250, 260]]) l.move(x, y, 1);
  l.up(250, 260);
  app.tool = 'brush';
  app.copySelection();
  app.selection = null; app.onSelectionChange();
  app.project.activeLayer = 2; app.clock.step(app.project.layers[2], 1);
  app.paste();
  const pasted = app.project.layers[2].frames[1];
  check('colar em outra camada e outro frame, no mesmo lugar', pasted.length === 1 && pasted[0].pts[0] === app.project.layers[0].frames[0][0].pts[0] && pasted[0].id !== app.project.layers[0].frames[0][0].id);
  check('o colado fica selecionado', app.selection?.ids.has(pasted[0].id));
  app.undo();
  check('desfazer o colar', app.project.layers[2].frames[1].length === 0);
}
{
  // Auto: volta e para no último
  const { app, wet } = makeApp();
  app.clock.paused = true; app.clock.t = 0;
  app.project.settings.autoDir = 'back';
  stroke(wet, 300, 300);
  check('Auto voltando: do frame 1 vai ao 8', app.clock.frameOf(app.project.layers[0]) === 7);
  app.project.settings.autoDir = 'forward'; app.project.settings.autoStop = true;
  stroke(wet, 300, 320);
  check('Auto parando no último: no frame 8 não dá a volta', app.clock.frameOf(app.project.layers[0]) === 7);
  const { sanitize: san } = await import('../src/doc/project.js');
  const bad = JSON.parse(JSON.stringify(app.project));
  bad.settings.onion = { before: 5, after: -1, strength: 3 }; bad.settings.autoDir = 'lado';
  const ok = san(bad).settings;
  check('ajustes do papel-cebola e do Auto conferidos ao abrir', ok.onion.before === 2 && ok.onion.after === 0 && ok.onion.strength === 0.8 && ok.autoDir === 'forward' && ok.autoStop === true);
}

// ---------- v0.6: codificadores GIF e ZIP (#044, #045) ----------
{
  const { lzwEncode, quantize, GifWriter } = await import('../src/io/gif.js');
  // decodificador LZW padrão (como o dos navegadores), só para conferir a ida e volta
  function lzwDecode(bytes, minCode) {
    let pos = 0, bit = 0;
    const read = (size) => {
      let v = 0;
      for (let i = 0; i < size; i++) {
        if (pos >= bytes.length) return -1;
        v |= ((bytes[pos] >> bit) & 1) << i;
        if (++bit === 8) { bit = 0; pos++; }
      }
      return v;
    };
    const clear = 1 << minCode, eoi = clear + 1;
    let size = minCode + 1, next = eoi + 1, dict = [], prev = null;
    const reset = () => { dict = []; for (let i = 0; i < clear; i++) dict[i] = [i]; size = minCode + 1; next = eoi + 1; prev = null; };
    reset();
    const out = [];
    for (;;) {
      const code = read(size);
      if (code < 0 || code === eoi) break;
      if (code === clear) { reset(); continue; }
      let entry;
      if (dict[code]) entry = dict[code];
      else if (code === next && prev) entry = prev.concat(prev[0]);
      else throw new Error('código inválido ' + code);
      out.push(...entry);
      if (prev && next < 4096) { dict[next++] = prev.concat(entry[0]); if (next === (1 << size) && size < 12) size++; }
      prev = entry;
    }
    return out;
  }
  let ok = true, info = '';
  for (const [n, colors, seed] of [[10, 4, 1], [1000, 4, 2], [5000, 2, 3], [60000, 256, 4], [60000, 16, 5], [200000, 3, 6]]) {
    let x = seed * 7919;
    const rnd = () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x; };
    const idx = new Uint8Array(n);
    for (let i = 0; i < n; i++) idx[i] = (i % 97 < 60 ? (i >> 4) : rnd()) % colors;   // trechos repetidos e ruído
    let bits = 2; while ((1 << bits) < colors) bits++;
    const back = lzwDecode(lzwEncode(idx, bits), bits);
    if (back.length !== n || back.some((v, i) => v !== idx[i])) { ok = false; info += `${n}/${colors} `; }
  }
  check('GIF: LZW codifica e decodifica igual (inclusive com o dicionário recomeçando)', ok, info);
  // paleta: imagem com 3 cores vira 3 cores exatas
  const w = 30, h = 20, img = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { const c = [[243, 239, 230], [255, 72, 176], [0, 120, 191]][i % 3]; img.set([...c, 255], i * 4); }
  const qz = quantize(img);
  check('GIF: paleta pega as cores exatas de um frame com poucas cores', qz.colors >= 3 && qz.palette[qz.indices[1] * 3 + 1] === 72);
  const g = new GifWriter(w, h);
  g.addFrame(img, 8); g.addFrame(img, 8);
  const bytes = g.finish();
  const head = String.fromCharCode(...bytes.slice(0, 6));
  check('GIF: arquivo começa com GIF89a, tem laço infinito e termina com 0x3B', head === 'GIF89a' && String.fromCharCode(...bytes.slice(16, 27)) === 'NETSCAPE2.0' && bytes.at(-1) === 0x3b);
}
{
  const { crc32, makeZip } = await import('../src/io/zip.js');
  check('ZIP: CRC32 de "123456789" = CBF43926', crc32(new TextEncoder().encode('123456789')) === 0xcbf43926);
  const z = makeZip([{ name: 'a.txt', data: new TextEncoder().encode('oi') }, { name: 'pasta/b.png', data: new Uint8Array([1, 2, 3]) }]);
  const dv = new DataView(z.buffer);
  const endAt = z.length - 22;
  check('ZIP: começa com PK\\3\\4 e o fim aponta 2 arquivos', dv.getUint32(0, true) === 0x04034b50 && dv.getUint32(endAt, true) === 0x06054b50 && dv.getUint16(endAt + 10, true) === 2);
  const cdOff = dv.getUint32(endAt + 16, true);
  check('ZIP: diretório central no lugar certo', dv.getUint32(cdOff, true) === 0x02014b50);
}

// ---------- v0.6: projetos e exportação (#043–#046) ----------
{
  const { planFrames, recordSeconds } = await import('../src/io/video.js');
  const { newProject: np, sanitize: san } = await import('../src/doc/project.js');
  const p = np();
  p.layers[0].frames[0].push({ id: 1, kind: 'ink', w: 5, pts: [1, 1, 1] });
  const plan = planFrames(p, 1);
  check('GIF: 1 volta de 8 frames a 8 fps = 8 quadros, atraso de 13 centésimos', plan.count === 8 && plan.delayCs === 13 && plan.seconds === 1, JSON.stringify({ c: plan.count, d: plan.delayCs }));
  check('GIF: 3 voltas = 24 quadros', planFrames(p, 3).count === 24);
  p.layers[1].fps = 24; p.layers[1].frames[0].push({ id: 2, kind: 'ink', w: 5, pts: [1, 1, 1] });
  check('GIF: usa o maior FPS das camadas desenhadas', planFrames(p, 1).fps === 24 && planFrames(p, 1).delayCs === 4);
  check('vídeo: voltas escolhidas valem', recordSeconds(p, 2) === 2 && recordSeconds(p) === 3);
  // uid: identidade do projeto na galeria
  const a = np(), b = np();
  check('projeto novo ganha uid próprio', typeof a.uid === 'string' && a.uid !== b.uid);
  check('abrir do navegador mantém o uid', san(JSON.parse(JSON.stringify(a))).uid === a.uid);
  const { projectFromText, projectToText } = await import('../src/io/file.js');
  check('abrir arquivo .grao cria uid novo (vira uma cópia na galeria)', projectFromText(projectToText(a)).uid !== a.uid);
  const bad = JSON.parse(JSON.stringify(a)); bad.uid = '<script>';
  check('uid inválido é trocado', san(bad).uid !== '<script>' && /^[a-z0-9-]+$/.test(san(bad).uid));
}

// ---------- v0.7: riso completo (#048–#053) ----------
{
  const { printOrder, sanitize: san, newProject: np } = await import('../src/doc/project.js');
  const { INKS } = await import('../src/config.js');
  const p = np();
  check('ordem de impressão: na ordem das camadas', printOrder(p).join() === '0,1,2,3');
  p.layers.reverse();
  check('ordem de impressão segue a camada de baixo de cada tinta', printOrder(p).join() === '3,2,1,0');
  p.layers = [p.layers[0], p.layers[0]];
  check('tintas sem camada vão para o fim da ordem', printOrder(p).join() === '3,0,1,2');
  check('toda tinta tem cobertura (sobreimpressão) entre 0 e 0,5', INKS.every((k) => k.opaque > 0 && k.opaque < 0.5));
  const q = np(); q.layers[0].screen = { type: 'am', density: 0.5, dot: 'losango' }; q.settings.flaws = { rollers: 1, transfer: true };
  const s = san(JSON.parse(JSON.stringify(q)));
  check('forma de ponto inválida vira redondo; imperfeições conferidas', s.layers[0].screen.dot === 'round' && s.settings.flaws.rollers === false && s.settings.flaws.transfer === true);
  check('imperfeições desligadas por padrão', np().settings.flaws.rollers === false && np().settings.flaws.transfer === false);
  const { app } = makeApp();
  app.setLayerScreen(0, { type: 'am', dot: 'line' });
  check('forma do ponto: linha', app.project.layers[0].screen.dot === 'line' && app.project.layers[0].screen.type === 'am');
  app.undo();
  check('desfazer a forma do ponto', app.project.layers[0].screen.dot === 'round' && app.project.layers[0].screen.type === 'stochastic');
}
{
  // checagem estática do shader (não há compilador de GLSL nesta máquina)
  const fs = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const path = await import('node:path');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const frag = fs.readFileSync(path.join(root, 'src/render/riso/riso.frag'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'src/render/riso/riso.js'), 'utf8');
  const code = frag.replace(/\/\/.*$/gm, '');
  const declared = new Set([...code.matchAll(/uniform\s+\w+\s+(\w+)/g)].map((m) => m[1]));
  const wanted = [...js.matchAll(/'(u[A-Z]\w*)'/g)].map((m) => m[1]);
  const missing = wanted.filter((n) => !declared.has(n));
  check('shader: todo uniform que o riso.js usa está declarado no .frag', !missing.length, missing.join(', '));
  const count = (ch) => code.split(ch).length - 1;
  check('shader: chaves e parênteses fecham', count('{') === count('}') && count('(') === count(')'));
  const samplers = [...code.matchAll(/uniform\s+sampler2D\s+\w+/g)].length;
  check('shader: até 16 texturas (limite mínimo do WebGL2)', samplers <= 16, samplers);
  check('shader: começa com #version 300 es e tem precisão', frag.startsWith('#version 300 es') && /precision\s+highp\s+float/.test(code));
  check('shader: nenhum smoothstep com limites invertidos óbvios (r + aa, r - aa)', !/smoothstep\(\s*r\s*\+\s*aa\s*,\s*r\s*-\s*aa/.test(code));
}

// ---------- v0.8: primeira vez (#055) ----------
{
  const { welcomeProject, HINTS } = await import('../src/doc/welcome.js');
  const { sanitize: san } = await import('../src/doc/project.js');
  const w = welcomeProject();
  const black = w.layers.find((L) => L.ink === 3), pink = w.layers.find((L) => L.ink === 0);
  check('boas-vindas: bola em 8 frames na tinta Preto', w.name === 'Boas-vindas' && black.frames.every((fr) => fr.length === 1 && fr[0].kind === 'ink'));
  check('boas-vindas: miolo por balde na Rosa flúor (balde com linha de outra tinta)', pink.frames.every((fr) => fr.length === 1 && fr[0].kind === 'fill'));
  check('boas-vindas: a bola anda (alturas diferentes entre frames)', new Set(black.frames.map((fr) => Math.round(fr[0].pts[1]))).size > 3);
  check('boas-vindas: traços com ids únicos', new Set(w.layers.flatMap((L) => L.frames.flat().map((s) => s.id))).size === w.layers.flatMap((L) => L.frames.flat()).length);
  check('boas-vindas: marcado como tal (dicas) e preservado ao salvar', san(JSON.parse(JSON.stringify(w))).welcome === true && !san(JSON.parse(JSON.stringify({ ...w, welcome: 'x' }))).welcome);
  check('3 dicas da primeira vez', HINTS.length === 3 && HINTS.map((h) => h.id).join() === 'draw,wheel,time');
}

// ---------- v0.9: qualidade automática (#060) ----------
{
  const { createQuality, LEVELS } = await import('../src/quality.js');
  const q = createQuality();
  let changed = false;
  for (let i = 0; i < 90; i++) changed = q.sample(30) || changed;
  check('qualidade: quadros lentos (30 ms) descem um nível', changed && q.scale === LEVELS[1]);
  for (let i = 0; i < 90 * 5; i++) q.sample(12);
  check('qualidade: rápido por menos de 10 s ainda não sobe', q.scale === LEVELS[1]);
  for (let i = 0; i < 90; i++) q.sample(12);
  check('qualidade: rápido por ~10 s sobe de volta', q.scale === LEVELS[0]);
  for (let i = 0; i < 90 * 10; i++) q.sample(40);
  check('qualidade: nunca abaixo do último nível', q.scale === LEVELS.at(-1));
  for (let i = 0; i < 90; i++) q.sample(1000);
  check('qualidade: aba voltando de segundo plano não conta', q.scale === LEVELS.at(-1));
  check('qualidade: desligada volta ao máximo', q.sample(16, false) === true && q.scale === LEVELS[0]);
}

console.log(`\n${fails ? `${fails} FALHA(S) de ${total}` : `TUDO OK (${total} verificações)`}`);
process.exit(fails ? 1 : 0);
