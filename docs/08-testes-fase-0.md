# 08 · Testes da Fase 0

**Antes de construir o compositor riso, três coisas são medidas no tablet: o que chega da caneta, a palma e a latência do traço. O resultado decide o [ADR-001](adr/ADR-001-plataforma-v0.1.md).**

## 1. O que chega da caneta

Página de teste mostra, para cada evento de ponteiro: `pointerType`, `pressure`, `tiltX`, `tiltY`, `buttons`, e se há hover (eventos sem contato).

- [ ] `pointerType` é `pen` para a caneta e `touch` para o dedo
- [ ] Pressão varia de forma suave (sem degraus visíveis)
- [ ] Inclinação chega (anotar se liga fácil demais)
- [ ] Botões laterais aparecem em `buttons`, ou o sistema os captura
- [ ] Hover chega antes de encostar

## 2. Palma

- [ ] Desenhar 2 minutos com a mão apoiada na tela, do jeito natural
- [ ] Contar traços ou ações falsas (meta: zero)
- [ ] Anotar se a palma chega como `touch` (ignorado) ou dispara `pointercancel`

## 3. Latência do traço

**Método (câmera lenta):**
1. Celular filmando a tela em câmera lenta (240 quadros/s ≈ 4,2 ms por quadro), apoiado e estável.
2. Desenhar linhas rápidas e retas.
3. No vídeo, contar os quadros entre a ponta da caneta e o fim da linha desenhada.
4. Latência ≈ quadros × 4,2 ms. Repetir 5 vezes e usar a mediana.

Comparar três situações:

| Situação | Latência medida | Sensação (1–5) |
| --- | --- | --- |
| Canvas 2D normal | | |
| Canvas 2D `desynchronized` | | |
| Referência: Concepts ou Infinite Painter (suavização zero) | | |

## Critérios de decisão

| Pergunta | Passa se | Se passar | Se falhar |
| --- | --- | --- | --- |
| Latência | `desynchronized` < 50 ms e sensação ≥ 4 | Web continua (ADR-001 → Aceito) | Traço vai para Kotlin + Ink API (novo ADR) |
| Palma | zero ações falsas em 2 min | Segue | Revisar filtro de toques |
| Botões da caneta | chegam ao app | Laço e borracha nos botões | Só pelas teclas da zona do polegar |

Registre os resultados aqui mesmo e no `CHANGELOG.md`.
