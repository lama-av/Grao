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
  tap(wet, ...at(206, base));
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

console.log(`\n${fails ? `${fails} FALHA(S) de ${total}` : `TUDO OK (${total} verificações)`}`);
process.exit(fails ? 1 : 0);
