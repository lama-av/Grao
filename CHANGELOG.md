# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões seguem `MAIOR.MENOR.CORREÇÃO`.

## [Não lançado]

### v0.2 em construção (build b6, prévia publicada)
- b6: pétalas Tinta e Ferramenta aceitam **encostar, arrastar e soltar** sobre a pastilha (antes só toque parado); destaque na pastilha sob o dedo; o toque longo numa tinta também aceita arrastar até a cor (#008).
- b6: `INSTRUCOES.txt` (como usar o Grão, atualizado a cada versão) e `docs/12-tintas-riso.md` (pesquisa das tintas riso: 78 cores com hex e Pantone U).
- Papel em tela cheia; a zona do polegar saiu. Interface nova: **roda de canto** desenhada num canvas por baixo do traço (ADR-002).
- Roda recolhida (64 px): tinta ativa, frames e parado; segurar e arrastar leva a outro canto (fica salvo).
- Roda aberta: centro toca/pausa; setores Desfazer, Refazer, Tinta, Ferramenta, Camadas, Mais; prato do tempo; arco de velocidade. Recolhe ao desenhar, salvo com "Fixar roda".
- Refazer (novo). Leituras "Desfeito", "Refeito", "Nada para desfazer".
- Pétala Tinta (toque longo troca a cor) e pétala Ferramenta: Pincel, Borracha (antigo Recorte), Laço fixo e Tamanho com prévia.
- Folha Mais (ajustes) e folha Camadas (FPS e frames). Chips "Duplicar →" e "Apagar" junto da seleção. Painel de teste no canto oposto à roda.
- Textos conforme o doc 11. Teste automático reescrito para a roda (ainda não rodado).
- `teste-caneta.html`: botão "Copiar resultados".

### Adicionado
- Caixa vermelha de erros na tela do app (fase de testes no tablet, onde não há console).
- Aviso ao abrir com a versão e o estado da baixa latência (para saber se o tablet pegou a versão nova).
- `teste-caneta.html`: teste da Fase 0 no tablet (valores de `buttons` da caneta, eventos do sistema, palma, latência normal × baixa latência).
- `diag.html`: página de diagnóstico do WebGL do tablet, com testes por partes do compositor.

### Corrigido
- Canvas todo preto no tablet (Chrome do Android): o modo baixa latência do traço molhado deixava a camada de cima opaca. Agora vem desligado; para testá-lo, abrir com `?baixa=1` no endereço.
- Publicado no GitHub Pages: https://lama-av.github.io/Grao/

## [0.1.0] — 2026-11-23

Primeira build: caderno web/PWA para testar no tablet (Fase 0 + núcleo do caderno).

### Adicionado
- Desenho com caneta: espessura pela pressão, pontos intermediários (`getCoalescedEvents`), traço molhado em canvas de baixa latência. Palma ou dedo nunca desenham.
- Recorte: botão Recorte, ou botão lateral da caneta segurado, apaga como papel.
- 4 tintas riso (riso-colors, MIT); toque longo numa tinta abre cor, FPS (6/8/12/24) e quantidade de frames (1–12).
- Compositor riso em WebGL2: papel com fibras e impurezas, grão, desalinhamento por tinta, "ferver" (8 reimpressões por segundo), papel-cebola quando o loop está parado.
- Laço segurado: enquanto o botão está apertado o loop congela e a caneta faz a seleção. Mover com a caneta; girar, escalar e mover com 2 dedos pousados sobre a seleção (+80 px de folga). Duplicar para o próximo frame; Apagar.
- Roda de tempo (prato): encostar segura o disco; 30° = 1 frame; centro toca/pausa. Fader de velocidade de −2× a 2× (encaixa em 1×; toque duplo volta a 1×).
- Desfazer: botão, ou toque rápido com 2 dedos. Depois do botão, a roda vira roda de histórico por 3 s.
- Auto: com o loop pausado, cada traço avança um frame.
- Leituras na zona do polegar (frame, velocidade, estado). Modo Canhoto. Painel "Teste da Fase 0" (pressão, inclinação, eventos/s, quadros/s, baixa latência).
- Salvamento automático no navegador (IndexedDB). Exportar PNG.
- Teste automático em Chrome sem tela: desenho, auto, toque de 1 dedo, laço, mover, duplicar, desfazer com 2 dedos, roda e recarregar.

### Decidido na build
- Uma seleção ativa também segura o loop parado (como o Laço), para o desenho não fugir enquanto é ajustado.

### Falta (próximas versões)
- Exportar vídeo, GIF e SVG por tinta; só PNG por enquanto.
- Pan e zoom do papel.
- Service worker (abrir sem rede).
- Sobreimpressão física (passadas por tinta); hoje as tintas se multiplicam numa passada só.
- Cada traço confirmado copia a máscara da CPU para a GPU (aviso "GPU stall due to ReadPixels" no teste); medir no tablet.

### Adicionado
- Estrutura do projeto e documentação: conceito, decisão do MVP, plataforma-alvo, design do sistema v0.1, motor riso, referências, roadmap, testes da Fase 0.
- ADR-001: plataforma do v0.1 (web/PWA), status Proposto.
- `CLAUDE.md` com contexto e regras para sessões com IA.
