# 07 · Roadmap

**Nada avança antes de testar a interação e o traço no tablet. Cada fase só começa quando a anterior passa no seu portão.**

| Fase | O que entra | Portão para seguir |
| --- | --- | --- |
| **0 · Protótipo e prova do traço** | Protótipo web no navegador do tablet: roda, laço, palma; medir latência do traço | Roda e laço funcionam sem erro de modo, e o traço não tem atraso perceptível (decide o [ADR-001](adr/ADR-001-plataforma-v0.1.md)) |
| **1 · MVP (Grão v0.1 → 1.0)** | 4 tintas e papel, pincel de tinta e borracha de recorte, loops de até 12 frames, laço simples, roda (prato + fader de velocidade), avanço automático, histórico na roda, loop vivo ao abrir, exportar vídeo, GIF, PNG e SVG | Uma animação de 8 segundos feita e exportada só no app |
| **2 · Clock MIDI e Palco** | Grão 1.1: clock MIDI. Depois o Palco: knobs e MIDI learn, gamepad, cenas, HDMI só com o canvas, gravar transformação no loop, grão no ritmo do clock | Um set ao vivo de 20 minutos sem travar |
| **3 · Prensa e Grão 2** | Prensa (web, p5.js): papéis, folhas, dpi, matriz por tinta, edições numeradas. Grão 2: modos de reprodução, lápis, retícula, paletas próprias, nudge; avaliar Play Store | — |

## Perguntas em aberto

- [ ] O app web recebe os botões da caneta? (Fase 0)
- [ ] A latência do traço no Chrome é boa o bastante? (Fase 0)
- [ ] Polia fixa na zona do polegar ou que aparece onde o dedo toca, como no Looom? (testar as duas)
- [ ] Nome definitivo e identidade visual
- [ ] Licença do projeto
