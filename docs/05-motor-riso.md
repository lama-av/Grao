# 05 · Motor riso

**O Grão simula uma risografia em 5 etapas de GPU por frame. Diferente do Diorame, não precisa separar a imagem em tintas — a etapa mais cara dele — porque cada camada do Grão já nasce como uma tinta.**

## Como os outros fazem

**Graintouch (iorama):** cada camada é um estêncil vetorial montado por um pincel que soma e recorta formas ("Bool Brush"); a impressão (grão, registro fora do lugar, tons) é simulada só na tela. O SVG exportado sai sem grão. Ponto fraco: exportação em imagem com baixa resolução.

**Diorame (código aberto, CC BY-NC-SA — só estudar):** 9 etapas, 13 a 16 passadas de GPU:

1. Limpeza (PREP) · 2. Tabela de separação (LUT 33³, densidade óptica / lei de Beer) · 3. Separação por pixel (SEP0 — metade do custo do frame no iPad, 13 ms)
4. Sobreimpressão (FILL) · 5. Desalinhamento (WARP) · 6. Trama (SCREEN) · 7. Espalhamento (SPREAD) · 8. Composição no papel (COMPOSE) · 9. Scanner (SCAN)

O Grão pula 1–3.

## As 5 etapas do Grão

| # | Etapa | O que faz |
| --- | --- | --- |
| 1 | Sobreimpressão | Na ordem de impressão (v0.7): cada passada multiplica e cobre um pouco a de baixo (`opaque` por tinta); a ordem muda a cor. Trapping do balde (v0.4) evita fios brancos |
| 2 | Desalinhamento | Cada tinta se desloca até 3 mm (A4), sorteado a cada reimpressão; cresce com a passada: 45%, 70%, 88%, 100% (v0.7) |
| 3 | Trama (retícula) | Por camada (v0.4): **estocástica** (grão em cachos, como a difusão de erro da riso) ou **reticulada** (pontos redondos em grade, ângulo por tinta). Ver "Retícula" abaixo |
| 4 | Espalhamento | Desfoque pequeno + corte: bordas orgânicas |
| 5 | Papel | Cor do papel com fibras e impurezas; tintas multiplicadas da mais clara para a mais escura |

Etapas 1–4 podem ser fundidas numa passada por tinta; a 5, numa passada final. Scanner (desfoque óptico + ruído de sensor) é opcional.

## Retícula (v0.4, #030)

Cada camada escolhe o tipo e a densidade (5% a 100%). A retícula é aplicada no compositor; os traços não guardam nada.

| | Estocástica (padrão) | Reticulada |
| --- | --- | --- |
| Como a riso faz | FM: pontos do mesmo tamanho, espaço variável | AM: pontos com espaço igual, tamanho variável |
| No Grão | Borda orgânica do grão; a densidade remove cachos de tinta (`vnoise` comparado com a densidade) | Grade girada; ponto redondo com área = tom × densidade; tons > 80% viram área cheia |
| Ângulo | — | Por tinta: 15°, 75°, 0°, 45° (moiré típico de riso) |
| Tamanho | ~1 unidade do documento | Lineatura do projeto: 40, 60 ou 85 lpi num A4 (célula = 1200 / (lpi × 11,69)) |

Comportamento da riso de verdade (Secret Riso Club, Risotrip):
- **Abaixo de 10%** a máquina falha: até 60% dos pontos caem ao acaso, e a escolha muda com o ferver.
- **Áreas cheias** imprimem irregulares: a variação de cobertura cresce de 50% e fica forte acima de 85%.
- **Desalinhamento** de 2 a 3 mm entre cores: o controle vai até 3 mm num A4 (1200 unidades = 297 mm).
- **Trapping** (#033): o balde avança 0,5 mm por baixo da linha, para não abrir filete de papel.

Sem moiré de pixel: a 60 lpi a célula tem ~3 px da tela do tablet em 100%. A borda do ponto é suavizada em meio
pixel por um uniforme (`uPxDoc`, unidades do documento por pixel), sem derivadas.

## Separações, prova e imperfeições (v0.7)

- **Separações:** um PNG cinza por tinta (preto = tinta, 5–100%), 300 dpi no A4, sem grão nem retícula; refeito dos
  traços na CPU (`rasterFrame`). É o arquivo que a gráfica riso pede (Risotrip).
- **Prova de impressão:** o frame atual em 2400 × 1600, parado, com tudo ligado.
- **Imperfeições** (desligadas): marcas de rolo nas áreas muito carregadas; transferência (fantasma espelhado do verso).

## Escala física

Grão e desalinhamento em **milímetros de um papel virtual** (o Diorame usa 240 mm de largura). Exportar em resolução maior dá a mesma impressão com mais detalhe, não um grão pela metade.

## Papel

Cada papel é uma cor e três números. Valores de partida (inspirados no modelo do Diorame; ajustar a olho):

| Papel | Cor | Fibras | Impurezas | Textura |
| --- | --- | --- | --- | --- |
| Natural | `#f3efe6` | 0,25 | 0,12 | 0,20 |
| Jornal | a definir | alta | média | média |
| Kraft | a definir | alta | baixa | alta |
| Reciclado | `#ebe5d6` | 0,50 | 0,60 | 0,35 |

Fibras podem "rejeitar" tinta (pequenos vazios), como no papel real.

## Ferver (reimpressão)

A semente aleatória vem do número da reimpressão (`floor(tempo × reimpressõesPorSegundo)`). Ao vivo, até 12 reimpressões/s; exportação usa a mesma regra, então o GIF sai igual ao que se viu.

## Qualidade

- Medir o tempo da GPU nos primeiros quadros; se passar de 8 ms → meia resolução, shaders simplificados.
- Exportação sempre na qualidade completa.
- Texturas próprias: ruído gerado por código. Não copiar texturas nem shaders do Diorame.

## Controles (poucos, com estilos prontos)

O Diorame expõe 8 controles e 4 estilos que ajustam ~35 parâmetros internos. O Grão segue a ideia: no MVP, **grão** (controle deslizante), **desalinhamento** e **ferver** (liga/desliga), mais estilos prontos depois.
