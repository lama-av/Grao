# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões seguem `MAIOR.MENOR.CORREÇÃO`.

## [Não lançado]

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
