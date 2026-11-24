// Tour do Grão (rc.4, pedido do Raphael): tutorial completo, passo a passo, com um "holofote" apontando cada parte.
// Começa sozinho na primeira vez no aparelho e fica no Menu → Tour do Grão. É uma tela própria (a caneta não
// desenha durante o tour), como as folhas: DOM só enquanto ninguém está desenhando.
//
// Cada passo: título, texto, estado da roda (fechada, aberta, pétala) e o alvo do holofote (da geometria da roda).

export const TOUR_STEPS = [
  { title: 'Bem-vindo ao Grão', text: 'Um caderno de animação em loop com cara de impressão riso. Este tour mostra tudo em uns 2 minutos. Dá para sair quando quiser e rever no Menu → Tour do Grão.' },
  { title: 'O papel', text: 'A tela inteira é papel. O loop nunca para: você desenha com a animação tocando. O grão "ferve" a cada reimpressão, como numa riso de verdade.' },
  { title: 'Caneta', text: 'Encoste e risque: a pressão muda a espessura. Botão 1 da caneta alterna a Borracha. Botão 2 segurado faz laço. Parar a caneta meio segundo no fim do traço endireita a linha.' },
  { title: 'Dedo', text: 'Com a caneta longe da tela, o dedo também desenha. Com a caneta encostada, a palma é ignorada; com a caneta perto, o dedo só faz gestos.' },
  { title: 'A roda', wheel: { open: false }, target: (g) => g.btn, text: 'Este botão abre a roda. Ele mostra a cor da tinta, a ferramenta e o frame atual. Segure e arraste para levar a roda a outro canto.' },
  { title: 'Tocar e pausar', wheel: { open: true }, target: (g) => g.center, text: 'O centro da roda toca e pausa o loop. As leituras rápidas ("3/8", "Desfeito") aparecem aqui.' },
  { title: 'Prato do tempo', wheel: { open: true }, target: (g) => g.plate, ring: true, text: 'Encoste no anel para congelar o loop e gire para andar frame a frame. A marca no alto é o frame 1. Logo depois de Desfazer, girar o prato desfaz e refaz passo a passo.' },
  { title: 'Velocidade', wheel: { open: true }, target: (g) => g.speed, text: 'O arco de fora muda a velocidade, de −2× (ao contrário) a 2×. Toque duas vezes para voltar a 1×.' },
  { title: 'Desfazer e refazer', wheel: { open: true }, target: (g) => g.sector('undo'), text: 'Desfazer e Refazer ficam no alto da roda. Também por gesto: toque rápido com 2 dedos desfaz; com 3 dedos, refaz.' },
  { title: 'Ferramentas', wheel: { open: true, petal: 'tool' }, target: (g) => g.sector('tool'), text: 'Perto da roda, as que riscam: Pincel, Lápis, Marcador, Giz. Mais longe, as que mexem: Borracha, Balde (respeita linhas de outras camadas) e Laço. Por fora, o tamanho, até 200.' },
  { title: 'Camadas e tintas', wheel: { open: true, petal: 'ink' }, target: (g) => g.sector('ink'), text: 'O projeto tem 4 tintas, como os tambores da riso, e até 8 camadas. "+" cria uma camada. Toque na camada ativa ou em "Ajustes" para a retícula (estocástica ou reticulada), a tinta e a ordem. Por fora, as 9 cores.' },
  { title: 'Tempo', wheel: { open: true }, target: (g) => g.sector('time'), text: 'A tira de frames da camada: inserir, duplicar, apagar e mover frames, exposição (um frame ficar mais tempo), FPS e número de frames.' },
  { title: 'Menu', wheel: { open: true }, target: (g) => g.sector('more'), text: 'Projetos, salvar e abrir arquivo, exportar, impressão (papel, grão, desalinhamento, lineatura, Prova de impressão) e ajustes de desenho.' },
  { title: 'Gestos', wheel: { open: false }, text: 'Com 2 dedos: toque rápido desfaz; arrastar para os lados anda no tempo; abrir ou fechar dá zoom (com zoom, arrastar move o papel); sobre a seleção, move, gira e muda o tamanho. Toque rápido com 3 dedos refaz.' },
  { title: 'Seleção', text: 'Faça um laço em volta do desenho. Junto da seleção aparecem Duplicar → (copia para o próximo frame), Copiar e Apagar. Com algo copiado e o loop parado, "Colar" aparece no alto.' },
  { title: 'Imprimir e exportar', text: 'Menu → Impressão → Prova de impressão vira a animação numa folha riso parada. Menu → Exportar… faz GIF, vídeo, PNGs e as separações por tinta para mandar à gráfica riso.' },
  { title: 'Pronto', text: 'Tudo salva sozinho neste aparelho; para guardar fora, Menu → Salvar arquivo. Rever o tour: Menu → Tour do Grão. Boa animação.' },
];

const SEEN_KEY = 'grao.tour';

export function tourSeen() { try { return !!localStorage.getItem(SEEN_KEY); } catch { return true; } }

export function setupTour(app) {
  let el = null, i = 0;

  function start() {
    if (el) return;
    app.sheet?.close();
    app.selection = null; app.onSelectionChange?.();
    el = document.createElement('div');
    el.className = 'tour';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Tour do Grão');
    el.innerHTML = `
      <div class="tour-spot" hidden></div>
      <div class="tour-card">
        <div class="tour-count"></div>
        <h2 class="tour-title"></h2>
        <p class="tour-text"></p>
        <div class="row">
          <button class="btn small" data-act="back">Voltar</button>
          <button class="btn small on" data-act="next">Próximo</button>
        </div>
        <button class="btn small tour-exit" data-act="exit">Sair do tour</button>
      </div>`;
    el.querySelector('[data-act="back"]').onclick = () => go(i - 1);
    el.querySelector('[data-act="next"]').onclick = () => (i >= TOUR_STEPS.length - 1 ? end() : go(i + 1));
    el.querySelector('[data-act="exit"]').onclick = () => end();
    document.body.appendChild(el);
    go(0);
  }

  function go(n) {
    i = Math.max(0, Math.min(TOUR_STEPS.length - 1, n));
    const st = TOUR_STEPS[i];
    if (st.wheel) app.ui?.tour?.(st.wheel);
    el.querySelector('.tour-count').textContent = `${i + 1} de ${TOUR_STEPS.length}`;
    el.querySelector('.tour-title').textContent = st.title;
    el.querySelector('.tour-text').textContent = st.text;
    el.querySelector('[data-act="back"]').disabled = i === 0;
    el.querySelector('[data-act="next"]').textContent = i === TOUR_STEPS.length - 1 ? 'Começar' : 'Próximo';
    app.announce?.(`${st.title}. ${st.text}`);
    place(st);
  }

  // Holofote no alvo e cartão do outro lado da tela.
  function place(st) {
    const spot = el.querySelector('.tour-spot'), card = el.querySelector('.tour-card');
    const g = app.ui?.geometry?.();
    const t = st.target && g ? st.target(g) : null;
    if (t) {
      const r = t.r + 10;
      Object.assign(spot.style, { left: `${t.x - r}px`, top: `${t.y - r}px`, width: `${2 * r}px`, height: `${2 * r}px` });
      spot.hidden = false;
      el.classList.add('has-spot');
    } else {
      spot.hidden = true;
      el.classList.remove('has-spot');
    }
    const leftSide = t ? t.x < window.innerWidth / 2 : null;
    card.style.left = card.style.right = '';
    card.dataset.side = t ? (leftSide ? 'right' : 'left') : 'center';
  }

  function end() {
    if (!el) return;
    el.remove();
    el = null;
    app.ui?.tour?.({ open: false });
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* sem armazenamento */ }
  }

  return { start, end, get open() { return !!el; } };
}
