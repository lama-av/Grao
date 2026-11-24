# 01 · Conceito

**Grão é um caderno de animação em loop com tinta riso, tocado como instrumento: desenhar como quem imprime, animar como quem toca.**
Android, caneta de verdade, loop que nunca para. Primeiro usuário: o próprio autor, no tablet XPPen.

## Diferencial

1. Android nativo de verdade (no navegador ou app), otimizado para tablet com caneta de pressão.
2. Desenhar e animar no mesmo gesto: o loop nunca para de tocar.
3. Uso ao vivo e MIDI — no projeto **Palco**, depois do MVP (ver [02](02-decisao-mvp.md)).

## Princípios (sete regras para decidir qualquer recurso)

1. **Restrição é estilo.** Poucas tintas, poucos pincéis, poucos frames.
2. **A caneta desenha, a outra mão comanda.** Caneta para traço e laço; o polegar cuida do tempo e dos modos.
3. **Nada para de tocar.** O loop roda o tempo todo, inclusive ao abrir o app.
4. **Interface que some.** Tela cheia de canvas; as únicas cores na tela são as tintas.
5. **Todo parâmetro pode ser tocado.** Se tem valor, pode ir para um knob MIDI ou gamepad (no Palco).
6. **O material é tempo, não papel.** O grão ferve no ritmo do loop; o Grão faz o que a impressão nunca fez.
7. **Um gesto, uma função.** Nenhum movimento muda de função conforme um estado escondido. Tecla que muda modo mostra isso enquanto pressionada.

## Ferramentas de ilustração

Cada camada é uma tinta, guardada como estêncil vetorial: traços se somam numa forma, a borracha recorta dela.
Grão, desalinhamento e mistura são calculados só na hora de mostrar (mesma lógica do Graintouch).

**Tintas:** 4 por projeto no MVP, de um catálogo curto da lista [riso-colors](https://github.com/mattdesl/riso-colors) (MIT).
Mistura multiplicativa: rosa sobre azul vira roxo.

**Papel:** escolhido ao criar o projeto — natural, jornal, kraft ou reciclado. A fibra interfere no grão e na cobertura.

**Pincéis**

| Pincel | Comportamento | Pressão controla | Quando |
| --- | --- | --- | --- |
| Tinta | Traço cheio que se soma à forma da camada | Espessura | MVP |
| Borracha de recorte | Subtrai da forma; no botão 2 da caneta | Espessura | MVP |
| Lápis granulado | Traço fino e granulado | Espessura e densidade | Depois |
| Retícula | Pontos de meio-tom | Tamanho dos pontos | Depois |

Inclinação da caneta desligada por padrão (neste tablet liga com qualquer leve inclinada).

**Efeitos de impressão:** grão (controle deslizante, não gesto), desalinhamento entre camadas, e **ferver** — o grão muda a cada frame, no ritmo do loop. Tinta irregular fica para depois.

## Animação

Tudo é loop. Ao abrir, um loop de 8 frames já roda com o grão fervendo.

- **Loops por camada:** 1 a 12 frames cada, durações diferentes geram polirritmo visual.
- **Desenhar no frame vivo:** o traço cai no frame na tela. Polegar parado na roda congela o frame.
- **Avanço automático:** cada vez que a caneta levanta, vai para o próximo frame (como o auto step do Looom).
- **Onion skin automático:** aparece enquanto o loop está congelado (anterior e seguinte, tingidos).
- **Timing:** FPS por camada (6, 8, 12, 24) e velocidade ao vivo pela borda da roda.
- **Depois do MVP:** modos de reprodução (frente, trás, ping-pong, aleatório).

## Laço, seleção e transformação

Como os frames são traços vetoriais, o laço pega traços inteiros e transforma sem borrar. No MVP, só no frame atual.

1. **Laço segurado:** enquanto o polegar segura a tecla Laço (ou o botão 1 da caneta), a caneta faz laço.
2. **Pega traços inteiros:** basta o laço encostar (como no Concepts).
3. **Transformar em seguida:** caneta dentro da seleção move; 2 dedos pousados sobre a seleção giram e escalam; fora dela, mexem no canvas.
4. **Ações curtas:** duplicar no próximo frame, trocar de tinta, espelhar, apagar. Uma transformação = um desfazer.

Depois do MVP: aplicar em todos os frames, gravar a transformação com o loop tocando (Palco), nudge, warp.

## Interface

Uma tela. Canvas ocupa tudo; a **zona do polegar** fica na borda (direita para canhotos), nunca sobre o canvas.

- **Tintas:** 4 bolinhas = 4 camadas. Toque troca; segurar abre FPS e frames da camada.
- **Laço (segurar):** acesa enquanto pressionada e **congela o loop** enquanto segura (não se faz laço num frame que se move).
- **Desfazer:** toque desfaz e, por 3 s, transforma a roda em roda de histórico (girar desfaz e refaz). Substitui "refazer" e evita pedir dois toques ao mesmo polegar.
- **Roda de tempo (prato):** encostar = segurar o disco (congela, mostra onion skin); girar = anda no tempo; soltar = volta a tocar; centro = tocar/pausar. Leituras na própria roda: frame (3/8), velocidade (1,0×), avanço automático.
- **Fader de velocidade:** vertical, ao lado da roda, como o pitch fader de um toca-discos. Abaixo do meio toca ao contrário; toque duplo volta a 1×.

> Revisado em 23/11/2026 a partir da [crítica de design](09-critica-de-design.md): a roda de dois anéis virou prato + fader.

Tabela completa de gestos no [README](../README.md#controles).

## Fluxos

1. **Abrir** → último projeto rodando (na primeira vez, loop de 8 frames pronto).
2. **Projeto novo** → 4 tintas e papel → canvas vivo.
3. **Tiragem (exportar)** → tela: MP4/WebM, GIF, sequência de PNG (opção 2× de resolução redesenhada). Gráfica no MVP: um SVG por tinta, sem efeito. Folhas, dpi, matrizes em PNG e edições numeradas ficam para a **Prensa**.
