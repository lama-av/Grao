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
| 1 | Sobreimpressão | A tinta clara continua sob a escura, para o desalinhamento não abrir fios brancos de papel |
| 2 | Desalinhamento | Cada tinta se desloca alguns décimos de mm, com valor sorteado a cada reimpressão |
| 3 | Trama | A cobertura vira grão, comparada com uma textura de ruído em cachos (como a difusão de erro da riso). Retícula (pontos com ângulo por tinta) fica para depois |
| 4 | Espalhamento | Desfoque pequeno + corte: bordas orgânicas |
| 5 | Papel | Cor do papel com fibras e impurezas; tintas multiplicadas da mais clara para a mais escura |

Etapas 1–4 podem ser fundidas numa passada por tinta; a 5, numa passada final. Scanner (desfoque óptico + ruído de sensor) é opcional.

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
