# 03 · Plataforma-alvo

**O Grão é feito primeiro para o XPPen Magic Drawing Pad (MDP1221), no Android 15. A caneta é excelente; tela e GPU são modestas — isso define pincéis leves, meia resolução nos loops quando preciso e gestos de no máximo 2 dedos.**

> A primeira versão do aparelho (2023, chip MT8771, caneta X3 Pro Pencil) ficou presa em Androids antigos. Este documento vale para o MDP1221.

| Item | Fato | Consequência no Grão |
| --- | --- | --- |
| Sistema | Android 15 por atualização OTA (saiu com o 14) | Mirar Android 14+ e Chrome atual |
| Chip e GPU | MediaTek MT8781 (2× A76 + 6× A55), Mali-G57 MC2, 8 GB RAM, 256 GB + microSD | Motor riso em 5 etapas; meia resolução ao vivo se a GPU não der conta |
| Tela | 12,2", 2160 × 1440 (3:2), IPS fosca, **60 Hz** | 16,7 ms por quadro; traço por canvas de baixa latência |
| Caneta | X3 Pro Slim: EMR sem bateria, **16.384 níveis**, inclinação de **60°**, ativa com 3 g | Pressão finíssima; pincéis só com pressão por padrão |
| Hover | Lê a caneta de 10 a 20 mm acima da tela | Mostrar o tamanho do pincel antes de encostar |
| Botões | 2 laterais, configurados pelo sistema (Voltar, Início, atalhos); sem borracha atrás | Testar se chegam ao app; se sim, laço e borracha |
| Precisão | ±0,4 mm no centro, ±1,5 mm nos cantos | Nada de botões pequenos nos cantos |

## Limitações relatadas (review da Parka Blogs)

- Inclinação liga fácil demais (qualquer leve inclinada muda o traço).
- Rejeição da palma mais fraca que em iPad e Samsung; a palma chega a disparar o desfazer de toque duplo.
- No Android 14, gestos com 3+ dedos não funcionavam. A XPPen diz que melhorou o refazer de 3 dedos no 15, mas o Grão não depende disso.
- Latência varia muito por app: melhor no Concepts e no Infinite Painter com suavização zerada.

## O que o navegador (Chrome Android) entrega

- Pointer Events com pressão e inclinação; `pointerType` separa caneta (`pen`) de dedo (`touch`).
- Canvas 2D com `desynchronized: true`: pula a atualização normal da página para reduzir latência.
- WebGL2 (GLSL ES 3.00).
- Web MIDI (Chrome Android desde a versão 43) — para o clock da versão 1.1.

## Checklist do primeiro dia no tablet

Ver [08 · Testes da Fase 0](08-testes-fase-0.md).

## Fontes

- [XPPen — Magic Drawing Pad (Android 15)](https://www.xp-pen.com/product/standalone-magic-drawing-pad.html)
- [XPPen — caneta X3 Pro Slim](https://www.xp-pen.com/index/banner_record?id=3347)
- [B&H — ficha técnica do MDP1221](https://www.bhphotovideo.com/c/product/1922699-REG/xppen_mdp1221_us_x3_pro_3_stylus.html)
- [Parka Blogs — review da edição 2025](https://www.parkablogs.com/content/xppen-magic-drawing-pad-2025-update)
- [Chrome — canvas de baixa latência (desynchronized)](https://developer.chrome.com/blog/desynchronized)
