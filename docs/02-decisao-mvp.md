# 02 · Decisão do MVP

**Decisão (aceita em 23/11/2026): dividir a ideia em três ferramentas. O Grão é o caderno e é o MVP. Palco (ao vivo) e Prensa (gráfica) são produtos separados que recebem o que o Grão exporta.**

```
                 loops                 OSC
  ┌──────────┐ ───────▶ ┌──────────┐ ◀──────── ┌──────────┐
  │   GRÃO   │          │  PALCO   │           │ Motor KV │
  │ caderno  │          │ ao vivo  │           │procedural│
  │  (MVP)   │ ───────▶ └──────────┘           └──────────┘
  └──────────┘   SVG    ┌──────────┐
                 ─────▶ │  PRENSA  │
                        │ gráfica  │
                        └──────────┘
```

## Por que dividir

Três usos diferentes puxam a interface para lados opostos: o palco quer tela limpa e muitos mapeamentos; a gráfica quer números precisos (folha, dpi); o caderno só quer caneta e tempo. Três ferramentas simples > uma complicada.
O Palco conversa com o TCC do autor sobre VJing e feedback de vídeo e com o cyberdeck; a Prensa pode nascer do protótipo em p5.js.

## O que cada lente do conselho de design decidiu

- **Ive (material):** o material é tinta riso em movimento. Ficam tinta, papel e grão que ferve. Retícula e lápis esperam.
- **Rams (economia):** saem do MVP MIDI completo, gamepad, cenas, HDMI, modos de reprodução, gravar transformação, retícula, lápis, paletas próprias, folha/dpi/edição.
- **Hadid (fluxo):** abrir → loop rodando → desenhar → congelar com o polegar → laço → exportar. Cada exportação é uma porta: vídeo para redes, loop para o Palco, SVG para a Prensa.
- **Ingels (encanto):** a roda de tempo é a identidade. Edição numerada é o encanto da Prensa. O protótipo em p5.js serve duas vezes.
- **Norman (clareza):** três controles e uma roda; tudo que é "segurar" acende; nenhum gesto muda de função.

**Tensão principal — MIDI:** estava na ideia original. Resolução: MVP sem MIDI; o **clock MIDI** (só tempo) é o primeiro recurso depois, na versão 1.1.

## Tabela de decisão

| Recurso | Decisão | Onde vive |
| --- | --- | --- |
| Traço com baixa latência e rejeição da palma | Essencial | Grão (MVP) |
| 4 tintas riso com mistura multiplicativa | Essencial | Grão (MVP) |
| Papel escolhido ao criar o projeto (4 opções) | Essencial | Grão (MVP) |
| Grão fervendo | Essencial: é a identidade | Grão (MVP) |
| Pincel de tinta e borracha de recorte | Essencial | Grão (MVP) |
| Loops por camada, até 12 frames | Essencial | Grão (MVP) |
| Roda de tempo (prato que congela ao encostar) e fader de velocidade | Essencial | Grão (MVP) |
| Avanço automático e histórico na roda | Essencial, custa pouco | Grão (MVP) |
| Laço simples no frame atual | Essencial | Grão (MVP) |
| Exportar vídeo, GIF, PNG e SVG por tinta | Essencial | Grão (MVP) |
| Clock MIDI | Logo depois do MVP | Grão 1.1 |
| Knobs e MIDI learn, gamepad, cenas, HDMI só com o canvas, gravar transformação, NDI | Outro produto | Palco |
| Folhas, dpi, matrizes em PNG, edições numeradas, mais papéis | Outro produto | Prensa |
| Modos de reprodução, laço em todos os frames, lápis, retícula, paletas próprias, nudge | Depois | Grão 2 |
| Integração com motion procedural | Fora do Grão | Motor KV ↔ Palco por OSC |
| Câmera 3D, multiplayer, desenhar em várias camadas ao mesmo tempo | Fora | — |

## Notas do conselho

Primeira avaliação: Ive 3, Rams 2, Hadid 3, Ingels 4, Norman 2. Com o MVP recortado e a divisão em três ferramentas, todas as lentes em 4. O que falta para 5 só se descobre com o protótipo nas mãos.

## Riscos apontados

| Risco | Como reduzir |
| --- | --- |
| Escopo crescendo a cada pesquisa | MVP fechado; tudo novo vai para "depois" até o MVP rodar |
| Erros de modo | Princípio 7; roda em dois anéis; 2 dedos só transformam sobre a seleção |
| Grão com cara de filtro | Grão que ferve; comparar com impressões reais |
| Construir antes de validar a interação | Protótipo web na Fase 0 |
