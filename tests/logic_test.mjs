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

const toasts = [];
function makeApp() {
  const app = {
    version: 'teste', project: newProject(), clock: new Clock(), selection: null, lassoHeld: false,
    tool: 'brush', historyUntil: 0, lowLatency: false, dirty: new Set(),
  };
  app.history = new History(app);
  app.markDirty = (l, f) => app.dirty.add(`${l}:${f}`);
  app.requestSave = () => {};
  app.saveNow = () => {};
  app.toast = (m) => toasts.push(m);
  app.masks = { clear() {}, rebuildAll() {}, drop() {}, rebuild() {} };
  installActions(app);
  app.sheet = { mode: null, open(m) { this.mode = m; }, close() { this.mode = null; } };
  app.debug = { pointer() {}, frame() {}, box: { dataset: {} } };
  const ui = fakeCanvas(), wet = fakeCanvas();
  app.ui = setupWheel(app, ui);
  app.input = setupInput(app, wet);
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
    down: (x, y, b = 1, btn = 0, p) => send('pointerdown', x, y, b, btn, p),
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
const BTN = [48, H - 48], WC = [136, H - 136];
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
for (const code of [4, 32]) {
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
  const inkAt = (k, n = 4) => at(206, base - (step * (n - 1)) / 2 + step * k);
  const d = pointer(wet, 'touch');
  d.down(...at(58, 180));
  check('encostar em Tinta abre a pétala', app.ui.petal === 'ink');
  d.move(...at(120, 200)); d.move(...inkAt(2)); d.up(...inkAt(2));
  check('arrastar e soltar escolhe a tinta', app.project.activeLayer === 2);
  check('a pétala fecha ao escolher', app.ui.petal === null);
  // tocar e tocar continua funcionando
  tap(wet, ...at(58, 180));
  tap(wet, ...inkAt(1));
  check('tocar e tocar escolhe a tinta', app.project.activeLayer === 1);
  // toque longo numa tinta abre as cores; arrastar até a cor e soltar troca a cor
  tap(wet, ...at(58, 180));
  const lp = pointer(wet, 'touch');
  lp.down(...inkAt(0));
  await sleep(600);
  check('toque longo abre as cores', app.ui.petal === 'inkcolor');
  const colorAt = (j) => at(206, base - (step * 7) / 2 + step * j);
  lp.move(...colorAt(5)); lp.up(...colorAt(5));
  check('arrastar até a cor troca a cor da tinta', app.project.layers[0].ink === 5, app.project.layers[0].ink);
  // pétala Ferramenta: Borracha
  tap(wet, ...at(58, 0));
  tap(wet, ...at(206, base - (step * 3) / 2 + step));   // 4 ferramentas: Pincel, Borracha, Balde, Laço
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
  const colorArc = (j) => at(270, -45 - (14 * 7) / 2 + 14 * j);
  tap(wet, ...colorArc(6));
  check('tocar numa cor do arco troca a cor da tinta ativa', app.project.layers[0].ink === 6, app.project.layers[0].ink);
  check('a pétala continua aberta depois de trocar a cor', app.ui.petal === 'ink');
  const d = pointer(wet, 'touch');
  d.down(...colorArc(4)); d.move(...colorArc(5)); d.move(...colorArc(7)); d.up(...colorArc(7));
  check('arrastar no arco e soltar troca a cor', app.project.layers[0].ink === 7);
}

// ---------- arquivo .grao ----------
{
  const { projectToText, projectFromText, fileNameFor } = await import('../src/io/file.js');
  const { app, wet } = makeApp();
  stroke(wet, 300, 200);
  app.project.name = 'Meu loop: ação!';
  app.project.layers[2].ink = 6;
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
  bad.layers.length = 2;                                                                 // faltam 2 tintas
  bad.nextId = 3; bad.activeLayer = 9; bad.paper = 'papelão';
  bad.settings.brush = 9999; bad.settings.wheelCorner = 'meio';
  const fixed = projectFromText(JSON.stringify(bad));
  const f0 = fixed.layers[0].frames[0];
  check('arquivo estragado: só os traços bons ficam', f0.length === 2 && f0[1].id === 902, f0.map((s) => s.id).join(','));
  check('arquivo estragado: tinta e FPS inválidos voltam ao padrão', fixed.layers[1].ink === 1 && fixed.layers[1].fps === 8);
  check('arquivo estragado: sempre 4 tintas', fixed.layers.length === 4);
  check('arquivo estragado: próximo id passa do maior id', fixed.nextId === 903, fixed.nextId);
  check('arquivo estragado: tinta ativa, papel e ajustes conferidos',
    fixed.activeLayer === 0 && fixed.paper === 'natural' && fixed.settings.brush === 40 && fixed.settings.wheelCorner === null);
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

console.log(`\n${fails ? `${fails} FALHA(S) de ${total}` : `TUDO OK (${total} verificações)`}`);
process.exit(fails ? 1 : 0);
