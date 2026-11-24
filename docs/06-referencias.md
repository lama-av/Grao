# 06 · Referências

**Nenhum app Android junta loop, estética de impressão e uso ao vivo. Os melhores modelos de interação estão no iPad (Looom, Callipeg, Procreate Dreams); o concorrente mais próximo em "riso + animação" é o Diorame, no navegador.**

## Apps parecidos

| App | Onde roda | O que o Grão pega | O que evita |
| --- | --- | --- | --- |
| [Graintouch](https://apps.apple.com/app/id6740813845) (iorama) | iPad, iPhone, Mac | Tinta como estêncil vetorial; grão só na tela; 18 tintas; pincel que soma e recorta | Exportação de baixa resolução; grão por gesto de pinça; só estático |
| [Looom](https://gsmarenas.netlify.app/host-https-www.iorama.studio/looom-user-guide) (iorama) | iPad | Camadas com tempo próprio; polia de tempo; auto step; histórico na polia; BPM e clock MIDI; 4 modos de reprodução | Polia que aparece em qualquer toque (palma); cor e espessura imprecisas |
| [Diorame](https://diorame.com/en/) | Navegador, código aberto | Papel como material; reimpressão animada; exportação tela × gráfica; qualidade medida; estilos prontos | Câmera 3D; licença não comercial |
| [Tagtool](https://apps.apple.com/app/id1129269238) (OMAi) | iPad | Desenhar e animar como papéis separados; gamepad; projetor; NDI | Exportação complicada |
| [Procreate Dreams](https://help.procreate.com/dreams/handbook/keyframes-and-performing/performing) | iPad | Gravar transformações ao vivo (Performing) | Recursos escondidos em gestos |
| [Callipeg](https://apps.apple.com/app/id1456172656) | iPad | Selecionar e mover entre frames; iPhone como controle | Gestos de 3–4 dedos |
| [Concepts](https://concepts.app/android/manual/selection) | Android, iOS, Windows | Laço que pega traços inteiros; nudge; menor latência neste tablet | Interface cheia |
| [Infinite Painter](https://docs.infinitestudio.art/painter/transform/) | Android, iOS | Funções do dedo separadas da caneta | Excesso de ferramentas |
| RoughAnimator | Android, iOS, desktop | Exportação para After Effects / Toon Boom | Timeline pesada para loops |
| [FlipaClip](https://flipaclip.com) | Android, iOS | Facilidade para começar | Nada de ao vivo |

## Código aberto útil

| Projeto | Licença | Uso no Grão |
| --- | --- | --- |
| [riso-colors](https://github.com/mattdesl/riso-colors) | MIT | Nomes e cores das tintas |
| [perfect-freehand](https://github.com/steveruizok/perfect-freehand) | MIT | Contorno do traço com pressão |
| [glsl-halftone](https://www.npmjs.com/package/glsl-halftone) | MIT / domínio público | Base da retícula (depois) |
| [risograph-grain-shader](https://github.com/Robpayot/risograph-grain-shader) (Codrops) | MIT | Referência de grão barato |
| [p5.riso](https://antiboredom.github.io/p5.riso/) | ver repositório | Separação de tintas — base da Prensa |
| [Cahier](https://android-developers.googleblog.com/2025/10/introducing-cahier-new-android-github.html) (Google) | ver repositório | Ponto de partida se o Grão virar Kotlin + Ink API |
| [android-midisuite](https://github.com/philburk/android-midisuite) | ver repositório | MIDI no Android nativo |
| [Diorame](https://github.com/DrKlanes/diorame) | CC BY-NC-SA | **Só estudar** (não copiar) |
| [Pencil2D](https://github.com/pencil2d/pencil) | GPL | **Só estudar** (copiar obriga o Grão a ser GPL) |

## Pesquisa de interação

- **Duas mãos (Guiard / MacKenzie):** a mão não dominante começa, define o contexto e trabalha no grosso; a dominante faz o detalhe. → caneta desenha, polegar comanda o tempo. [CHI 2001](https://www.yorku.ca/mack/CHI01b.htm)
- **Caneta + toque:** caneta na mão dominante e toque na outra juntam o melhor dos dois. [estudo](https://scholar.harvard.edu/sites/scholar.harvard.edu/files/chiashen/files/combining_and_measuring_the_benefits_of_bimanual_pen_and_direct-touch_interaction.pdf)
- **Looom (Apple, Behind the Design):** controles fixos para escolher frames obrigavam o animador a parar → tempo virou carretel. [link](https://developer.apple.com/cn/news/?id=s26ze13m)
- **Seleção (Ink & Switch):** quatro jeitos de o laço decidir o que pega. [link](https://inkandswitch.com/ink/notes/selection-gestures)

## Plataforma e stack

- [Ink API (Jetpack) — versões](https://developer.android.com/jetpack/androidx/releases/ink) (estável desde 1.0.0, dez/2025)
- [Rejeição da palma no Android](https://developer.android.com/develop/adaptive-apps/cookbook/stylus-palm-rejection)
- [Chrome — canvas de baixa latência](https://developer.chrome.com/blog/desynchronized)
- [Web MIDI — suporte](https://caniuse.com/midi)

## Licenças: regra do projeto

MIT, BSD, Apache e domínio público podem entrar, com crédito no `README.md`. GPL e não comercial (NC): só estudar e reescrever.
