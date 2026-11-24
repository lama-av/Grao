// Service worker do Grão (#035): guarda os arquivos do app para ele abrir sem internet.
// Versão nova publicada: o navegador baixa este arquivo (ele muda a cada versão), guarda os arquivos novos em
// segundo plano e espera. O app mostra "Nova versão. Toque para atualizar." no botão da roda, e só troca quando a
// pessoa toca (nunca recarrega sozinho). Os desenhos ficam no IndexedDB do aparelho e não passam por aqui.
//
// A CADA VERSÃO: atualizar VERSION abaixo (= VERSION-BUILD do src/config.js) e a lista FILES se entrar arquivo novo.
// O teste de lógica confere as duas coisas.

const VERSION = '1.0.0-rc.4-b21';
const CACHE = `grao-${VERSION}`;
const FILES = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'assets/icon.svg',
  'src/actions.js',
  'src/clock/clock.js',
  'src/config.js',
  'src/doc/history.js',
  'src/doc/project.js',
  'src/doc/welcome.js',
  'src/input/gestures.js',
  'src/input/input.js',
  'src/io/file.js',
  'src/io/gif.js',
  'src/io/storage.js',
  'src/io/video.js',
  'src/io/zip.js',
  'src/main.js',
  'src/quality.js',
  'src/render/fill.js',
  'src/render/masks.js',
  'src/render/riso/riso.frag',
  'src/render/riso/riso.js',
  'src/render/riso/riso.vert',
  'src/render/stroke.js',
  'src/render/thumb.js',
  'src/schedule.js',
  'src/ui/debug.js',
  'src/ui/dialog.js',
  'src/ui/sheet.js',
  'src/ui/tour.js',
  'src/ui/wheel.js',
  'src/view.js',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' pula o cache HTTP do GitHub Pages (10 min): guarda exatamente a versão publicada
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('grao-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// O app manda 'atualizar' quando a pessoa toca no aviso de versão nova.
self.addEventListener('message', (e) => { if (e.data === 'atualizar') self.skipWaiting(); });

// Arquivos do app: primeiro o guardado (abre sem rede); o resto (páginas de teste) vai direto à rede.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
