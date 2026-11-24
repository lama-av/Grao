# ADR-003: Reconhecedor de gestos de 2 dedos

**Status:** Aceito
**Data:** 24/11/2026
**Decisores:** Raphael (produto), chat (design), VS Code (implementação)

## Contexto

Hoje o `src/input/input.js` trata 2 dedos assim: sobre a seleção = transformar (decisão 10); fora dela = pinça
de zoom e mover o papel (#019); toque rápido = desfazer. O Raphael pediu um quarto gesto: **arrastar 2 dedos para
os lados anda no tempo**, como o prato da roda.

O que pesa na decisão:
- **Mesmo movimento, dois significados possíveis**: arrastar em paralelo serve para mover o papel e para andar
  no tempo.
- **A palma é forte neste tablet** (rejeição fraca). Palma + dedo podem parecer um gesto de 2 dedos.
- **A lógica de gestos está espalhada** num `input.js` de 21 KB, dentro de `touchDown`/`touchMove`/`touchUp`.
  Mais um ramo ali aumenta o risco de regressão.
- **O teste de lógica** (`tests/logic_test.mjs`) precisa testar o gesto sem navegador.

## Decisão

Criar `src/input/gestures.js`: uma máquina de estados pura, sem DOM. Ela recebe os toques já em pixels de CSS e
devolve **uma** intenção por gesto. O `input.js` só repassa os eventos e executa a intenção.

```
              ┌── pousou sobre a seleção (caixa + 80 px) ──────────────→ TRANSFORMAR
 2 dedos ─→ DECIDINDO ─┬─ soltou rápido (< 200 ms, < 12 px) ──────────────→ DESFAZER
 (palma     (até 24 px ├─ distância mudou ≥ 10% ──────────────────────────→ PAPEL (zoom + mover)
 filtrada)  de mov.)   └─ andaram juntos (distância estável):
                           papel em 100% e movimento mais horizontal ─────→ TEMPO
                           com zoom ───────────────────────────────────────→ PAPEL (mover)
```

**Regras:**
- **A intenção é decidida uma vez** e não muda até os dois dedos saírem (um gesto, uma função).
- **TEMPO:**
  - o deslocamento horizontal acumulado anda um frame da tinta ativa a cada 48 px (`SCRUB_PX_PER_FRAME`,
    em `config.js`), com `clock.step(layer, ±1)`; direita = para frente;
  - segura o loop com `clock.holds.add('scrub')` e solta ao terminar;
  - pede ao `#ui` a régua de frames e a leitura "3/8";
  - a roda de histórico **não** vale aqui: arrastar é sempre tempo.
- **PAPEL:** o código atual de `pinch()`/`settle()` do `view.js`, sem mudança.
- **Filtro de palma (antes de tudo):**
  - toque ignorado se a caneta estiver encostada, pairando ou tiver saído há menos de 300 ms
    (`PEN_GUARD_MS`);
  - toque ignorado se `width` ou `height` do PointerEvent passar de 40 px (`PALM_CONTACT_PX`), quando o
    navegador informar esses valores;
  - um toque ignorado continua ignorado até sair, mesmo que a caneta se afaste.
- **Saída da máquina**: objetos simples, por exemplo `{type:'scrub', frames:+1}`, `{type:'pinch', start, now}`,
  `{type:'xf', start, now}`, `{type:'undo'}`, `{type:'end', intent}`, `{type:'cancel', intent}`. Cancelamento
  do sistema (`pointercancel`) gera `cancel`: TEMPO volta ao frame de antes; TRANSFORMAR volta como no #017.

## Opções consideradas

### Opção A: máquina de estados em módulo próprio, decidida pela distância e pelo zoom (escolhida)
| Dimensão | Avaliação |
| --- | --- |
| Complexidade | Média |
| Risco de regressão | Baixo (o teste de lógica alimenta a máquina com toques falsos) |
| Clareza para quem usa | Boa: o zoom fica à vista no papel |
| Familiaridade | Alta: JavaScript puro, como o resto |

**Prós:** testável sem navegador; uma intenção por gesto; o filtro de palma fica num lugar só.
**Contras:** com zoom, o tempo só anda pelo prato da roda.

### Opção B: tempo sempre na horizontal, papel só pela pinça
**Prós:** o tempo funciona em qualquer zoom. **Contras:** mover o papel sem mudar o zoom fica quase impossível;
vai contra o hábito de todo app de desenho.

### Opção C: travar por eixo (horizontal = tempo, vertical = mover o papel)
**Prós:** os dois sempre disponíveis. **Contras:** mover o papel só na vertical é estranho; gesto diagonal
ambíguo; erro frequente.

### Opção D: acrescentar mais um ramo dentro do `input.js`
**Prós:** menos arquivos. **Contras:** o arquivo já tem 21 KB; difícil de testar; o filtro de palma ficaria
repetido.

## Análise

O conflito real é entre B e A: o tempo em qualquer zoom ou mover o papel com naturalidade. No Grão o papel fica
em 100% quase sempre (é um caderno de loop, não uma ilustração gigante), então o gesto de tempo vale na maior
parte do uso. A pinça que encaixa em 100% (#019) faz a volta ao modo de tempo custar um movimento.

## Consequências

- **Fica mais fácil:** acrescentar gestos e testá-los; ajustar os limites de palma num lugar só.
- **Fica mais difícil:** nada de importante; o `input.js` perde a lógica de 2 dedos para o módulo novo.
- **Rever depois do teste no tablet:**
  - os limites (48 px, 24 px, 10%, 300 ms, 40 px);
  - se o Chrome do XPPen informa `width`/`height` dos toques;
  - se o filtro de palma bloqueia toques legítimos da mão livre na roda (a roda **não** passa pelo filtro de
    tempo da caneta: tocar a roda com a caneta perto continua valendo).

## Itens de ação

1. [ ] `src/input/gestures.js` com a máquina e os limites em `config.js` (#022).
2. [ ] `input.js` passa a usar a máquina; comportamento atual de TRANSFORMAR, PAPEL e DESFAZER mantido (#022).
3. [ ] Intenção TEMPO + régua no `#ui` (#023).
4. [ ] Filtro de palma (#024).
5. [ ] Verificações no `tests/logic_test.mjs` para cada caminho do diagrama, incluindo palma e cancelamento.
