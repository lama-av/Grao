# ADR-002: interface desenhada em canvas, por baixo do traço molhado

**Status:** Aceito
**Data:** 2026-11-23
**Decide:** Raphael Magalhães

**Decisão:** a roda de canto, os chips e a caixa da seleção são desenhados num canvas 2D (`#ui`) entre o riso
(`#gl`) e o traço molhado (`#wet`). O `#wet` fica no topo, recebe todos os toques e repassa à roda os que caem
na área dela. Elementos HTML só aparecem com a caneta parada (folhas Mais e Camadas, painel de teste).

## Contexto

A v0.2 tira a zona fixa do lado e põe o papel na tela inteira (pedidos #001–#007 do `HANDOFF.md`). A interface
precisa ficar sobre o papel sem atrapalhar o traço.

O plano original contava com o canvas do traço em modo baixa latência (`desynchronized`). No tablet (Chrome do
Android, Mali-G57) esse modo **não tem transparência**: o vazio fica preto e esconde o papel (teste 6 do
`diag.html`, 23/11/2026; dúvida D1 do `HANDOFF.md`). A v0.2 roda sem esse modo (decisão do Raphael, opção A).

## Opções consideradas

### A. Roda em canvas `#ui`, `#wet` no topo repassando os toques (escolhida)

| Dimensão | Avaliação |
| --- | --- |
| Complexidade | Média (teste de acerto feito à mão) |
| Velocidade de iteração | Boa: a roda é só desenho 2D |
| Familiaridade do autor | Alta (parecido com p5.js) |

**Prós:** um único ponto recebe os toques, então caneta e dedo seguem as mesmas regras (palma, `pointercancel`).
Nada de DOM por cima do traço. Se um dia a baixa latência voltar num canvas opaco no topo, a roda continua igual.
**Contras:** acessibilidade (leitor de tela) precisa ser feita à parte; a roda não tem `aria-label` por setor.

### B. Roda em HTML/SVG por cima do papel

**Prós:** botões nativos, acessibilidade de graça.
**Contras:** elementos por cima do canvas do traço impedem a baixa latência no futuro e dividem os eventos entre
dois lugares (o filtro de palma teria de existir duas vezes).

## Análise das trocas

A opção A mantém aberto o caminho da baixa latência (dúvida D1, opção B: canvas opaco no topo) e concentra a
entrada num só arquivo (`input.js`). O custo de acessibilidade fica registrado para a v0.8 (T-072).

## Consequências

- **Fica mais fácil:** mudar a forma da roda (só desenho); testar com eventos sintéticos no `#wet`.
- **Fica mais difícil:** leitor de tela; textos da roda precisam caber em arcos pequenos.
- **A revisitar:** se a latência medida na Fase 0 ficar ruim, estudar um canvas opaco no topo que desenhe o
  papel e o traço juntos.

## Próximos passos

- [ ] Medir a latência sem `desynchronized` (`teste-caneta.html`, parte 3).
- [ ] Rótulos acessíveis para a roda (v0.8).
