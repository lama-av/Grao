# Relatório da v0.2 (prévia b6): resposta ao HANDOFF

**Para:** o Claude do chat (claude.ai), na pausa de auditoria da v0.2
**De:** o Claude do VS Code, com o resultado do teste do Raphael
**Data:** 24/11/2026 · **Build no ar:** `0.2.0-b7` em https://lama-av.github.io/Grao/ (o relatório foi escrito na b6)
**Detalhes de cada pedido:** `HANDOFF.md` (respostas do VS Code) e `CHANGELOG.md`

## Resumo

- Os pedidos **#001 a #006** estão implementados. Faltam duas coisas: o segundo botão da caneta (#005) e rodar o
  teste automático (#007).
- O Raphael fez no tablet a **sessão de animação só com a roda** pedida no plano: **"funcionou tudo certo"**.
- Durante o processo apareceram **3 mudanças de rumo** (baixa latência, bug das pétalas, cores) e **2 queixas de
  UX** que precisam de design: cores escondidas e falta de menu principal (D3).
- A versão continua `0.1.0`. Ela sobe para 0.2.0, com o `.docx`, depois desta auditoria.

## 1. O que saiu diferente do que o HANDOFF pedia

| # | O HANDOFF pedia | O que foi feito | Por quê |
| --- | --- | --- | --- |
| #001 | Traço molhado (`#wet`) com **baixa latência** (`desynchronized`) | `#wet` **sem** baixa latência. Liga só com `?baixa=1`. | No Chrome do Android esse modo deixa o canvas **preto** (sem transparência). Testado no tablet em 23/11. Decisão do Raphael: opção A da D1. |
| #003 | Todos os alvos com pelo menos 48 px | Anel de setores com **44 px** de espessura e prato com **40 px**, como diz a especificação | Os dois números do pedido se contradizem. Cada alvo é comprido (área maior que 48×48), mas a espessura fica abaixo de 48. **O chat decide** se aumenta a roda. |
| #003 | Arco de velocidade encaixa em 1× | Encaixa em **1× e em 0×** | Fica fácil parar pela velocidade. Pequeno acréscimo. |
| #004 | Leituras "Desfeito", "Refeito", "Nada para desfazer" | Também **"Nada para refazer"** | Não estava no doc 11; segue o mesmo padrão. **Incluir no doc 11.** |
| #005 | Pétalas por toque | Toque **e** "encostar, arrastar e soltar" (pedido #008, build b6) | Bug achado pelo Raphael: arrastar até a cor não fazia nada. |
| #005 | Laço fixo na pétala Ferramenta | Com o Laço fixo, a caneta **dentro da seleção move**; fora, faz um laço novo | Sem isso, não dava para mover a seleção com o Laço ativo. |
| #006 | Itens da folha Mais (lista fechada) | Também **Auto** | Ajuste da v0.1 que não estava na lista; o pedido exigia "todos os ajustes continuam acessíveis". |
| #007 | Confirmação de Novo projeto com o texto do doc 11 | Usa a **caixa padrão do navegador** (botões OK/Cancelar) | Ainda não foi feita uma caixa própria com "Apagar e começar". |

## 2. O que foi feito além do HANDOFF

- **#008 (bug, b6):** as pétalas aceitam arrastar e soltar; a pastilha sob o dedo ganha destaque.
- **`INSTRUCOES.txt`** (raiz): manual de uso em texto simples, pedido pelo Raphael. É atualizado a cada mudança
  visível.
- **`docs/12-tintas-riso.md`:** pesquisa das tintas riso pela Stencil Wiki (81 tintas em Padrão, Edição especial
  e Sob encomenda). As 8 do Grão já usam os valores atuais. **O Raphael não quer mais cores; as 8 ficam.**
- **Ferramentas de teste no tablet:** `teste-caneta.html` (botões da caneta, palma, latência, com o botão
  "Copiar resultados") e `diag.html` (WebGL por partes). Uma caixa vermelha de erros aparece na tela do app.
- **Aviso de versão ao abrir** (`Grão 0.1.0-bN`): mostra se o tablet pegou a build nova (o GitHub Pages guarda
  cópia por 10 min).
- **ADR-002** (interface desenhada em canvas, por baixo do traço) escrito, com status Aceito.

## 3. Resultado do teste no tablet (Raphael, 24/11)

- Sessão de animação só com a roda: **funcionou tudo certo**. Nenhum P1 aberto.
- Teste da caneta (Fase 0): **ainda não enviado**. Ele destrava o segundo botão da caneta (#005).
- Latência sem `desynchronized`: nenhuma queixa na sessão. Ainda não foi medida (vídeo em câmera lenta).

## 4. Pedidos e queixas do Raphael para o chat desenhar

Detalhes nas dúvidas **D2** e **D3** do `HANDOFF.md`.

**Queixas de UX da v0.2 (D3), prioridade dele:**
1. **Cores escondidas.** As 8 cores só aparecem com o toque longo numa tinta; nada mostra que dá para trocar.
   Limite a respeitar: **até 4 tintas por projeto** (limite da riso impressa), escolhidas entre as 8.
2. **Falta um menu principal.** Ele quer Novo, Salvar e Abrir à vista. Hoje só existe o salvamento automático
   no navegador. Caminho técnico possível: arquivo `.grao` baixado para a pasta Downloads e aberto de volta
   (T-051, hoje na v0.6). O salvamento automático continua por baixo.

**Pedidos de recursos (D2), com a posição do VS Code:**

| Pedido | No plano? | Recomendação |
| --- | --- | --- |
| Menu de arquivo e `.grao` | v0.6 (T-050/T-051) | Trazer o T-051 para uma v0.2.1, junto com a queixa 2 |
| "Camadas" confuso (hoje camada = tinta; a folha só tem tempo) | v0.4 | Renomear o setor para "Tempo" até a v0.4 |
| Girar e escalar a seleção | **Já existe** (2 dedos sobre a seleção) | O problema é descobrir; criar uma dica ou alças |
| Exportar GIF e MP4 | v0.6 (T-052) | Manter ou antecipar o GIF. **MOV não** (o navegador não grava) |
| Balde, linha reta | v0.3 (T-022/T-023) | Seguir o plano |
| Opacidade | v0.4 (retícula 10–100 %) | Seguir o plano |
| Caneta Bézier | Não | Não recomendado (precisão vetorial, contra a ideia de caderno) |
| Modos de mistura; cor de linha e de preenchimento | Não | Não recomendado (riso é sempre sobreimpressão; cada camada tem uma tinta) |

## 5. O que ainda está aberto no HANDOFF

- **#005:** segundo botão da caneta segura o Laço. Espera o resultado do `teste-caneta.html`. O código já tem
  `app.lassoHeld` pronto para isso.
- **#007:** rodar `tests/smoke_test.py` (precisa de Playwright nesta máquina). A caixa de confirmação própria
  para Novo projeto ainda não foi feita.
- **Fechar a v0.2:** checklist da pausa de auditoria, `VERSION = 0.2.0` e
  `docs/versoes/Grao_Documentacao_v0.2.0.docx`.

## 6. Decisões que o chat precisa tomar

1. Como mostrar as cores trocáveis das 4 tintas (D3.1)?
2. Onde fica o menu principal, com quais itens, e se entra numa v0.2.1 junto com o `.grao` (D3.2 e D2)?
3. Aumentar a roda para os setores e o prato terem 48 px de espessura, ou aceitar 44 e 40 px?
4. Renomear "Camadas" para "Tempo" até a v0.4?
5. Como ensinar que 2 dedos giram e escalam a seleção?
6. Liberar a v0.2 (subir para 0.2.0) agora ou depois da v0.2.1?

## 7. Fechamento (24/11, build b7)

Depois do relatório, o Raphael pediu e o VS Code fez:

- **#009, botões da caneta:** o botão 1 **alterna** Pincel e Borracha; o botão 2 **segura** o Laço. Isso substitui o
  "segurar para apagar" do #005. O botão recolhido da roda mostra a ferramenta atual (cheio, vazado ou tracejado).
- **#007 fechado:** caixa de confirmação própria ("Apagar e começar") e um **teste de lógica** que roda sem navegador
  (`tests/logic_test.mjs`, 42 verificações passando).
- **Versão 0.2.0** fechada: `VERSION`, `CHANGELOG.md` e `docs/versoes/Grao_Documentacao_v0.2.0.docx`.

As decisões da seção 6 continuam abertas. Enquanto o chat não responde, o VS Code segue com a v0.2.1, atendendo às
queixas da D3 (menu principal com arquivo `.grao`, cores à vista). A ordem foi pedida pelo Raphael.
