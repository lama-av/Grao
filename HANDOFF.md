# HANDOFF.md — pedidos de implementação para o Claude do VS Code

Este arquivo é a ponte entre as duas conversas:

- **claude.ai (chat):** onde o Raphael testa no tablet e discute feedback, UI e UX. Lá cada decisão vira um
  **pedido** neste arquivo.
- **VS Code (Claude Code):** onde os pedidos viram código. Não reabra a discussão de design: implemente o que
  está escrito. Se algo for impossível, ambíguo ou contrariar o `CLAUDE.md`, anote em **Dúvidas** e pare
  naquele pedido.

## Como o Claude do VS Code usa este arquivo

1. Leia o `CLAUDE.md` e depois este arquivo, de cima para baixo.
2. Pegue os pedidos com status **A fazer**, na ordem de prioridade (P1 antes de P2).
3. Para cada pedido:
   - marque **Fazendo** enquanto trabalha;
   - implemente só o que está em **O que fazer**, respeitando **Não fazer**;
   - confira cada item de **Pronto quando**;
   - rode `python tests/smoke_test.py` se mexeu em `input/`, `ui/`, `doc/` ou `main.js`;
   - adicione uma linha no `CHANGELOG.md`;
   - mude o status para **Feito** e preencha **Resposta do VS Code**: o que mudou, arquivos tocados, o que
     ficou de fora e **o que testar no tablet**.
4. Nunca apague pedidos feitos. Quando a seção **Feitos** ficar longa, mova-os para `docs/handoff-arquivo.md`.
5. Ao fechar uma versão (0.2.0…), atualize `VERSION` em `src/config.js`, o `CHANGELOG.md` e gere o
   `docs/versoes/Grao_Documentacao_vX.Y.Z.docx` (regra do `CLAUDE.md`).

## Como o chat escreve um pedido

Copie o modelo, dê o próximo número e coloque em **Fila**. Um pedido = uma mudança que dá para testar sozinha.

```markdown
### #000 — Título curto
- **Status:** A fazer · **Prioridade:** P1 (bloqueia o uso) | P2 (melhora clara) | P3 (detalhe)
- **Versão alvo:** 0.x.0
- **Origem:** teste no tablet de DD/MM | crítica de UX | pedido do Raphael
- **Problema:** o que acontece hoje e por que atrapalha (em uma ou duas frases).
- **O que fazer:**
  - comportamento esperado, passo a passo, do ponto de vista de quem usa;
  - valores concretos quando houver (tamanhos, tempos, ângulos).
- **Não fazer:** limites (o que não mexer, o que fica para depois).
- **Pronto quando:**
  - [ ] critério verificável 1
  - [ ] critério verificável 2
- **Arquivos prováveis:** `src/...` (sugestão, não obrigação)
- **Resposta do VS Code:** _(preenchido pelo VS Code)_
```

---

## Fila

> **v0.2 — Tela limpa e roda de canto.** Especificação completa em `docs/10-plano-ate-v1.md` (seção "A roda de
> canto") e textos em `docs/11-textos-da-interface.md`. Faça os pedidos na ordem. Ao terminar todos, suba
> `VERSION` para 0.2.0 e gere o docx da versão.

### #001 — Papel em tela cheia e canvas de interface
- **Status:** A fazer · **Prioridade:** P1 · **Versão alvo:** 0.2.0
- **Origem:** pedido do Raphael (interface mínima, sem aba fixa)
- **Problema:** a zona do polegar ocupa uma faixa fixa do lado e diminui o papel.
- **O que fazer:**
  - remover a `aside#thumb`; o palco 3:2 ocupa a tela inteira (letterbox só se a tela não for 3:2);
  - empilhar três canvases: `#gl` (riso) → `#ui` (canvas 2D comum, para roda, chips e caixa da seleção) →
    `#wet` (traço molhado, continua no topo e com `desynchronized`);
  - `#wet` recebe todos os eventos; criar um ponto único de "hit test" que entrega à roda os toques que caem na
    área dela e ao papel o resto;
  - a caixa tracejada da seleção passa a ser desenhada no `#ui` (o `#wet` fica só para o traço e o laço).
- **Não fazer:** nenhum elemento HTML por cima do `#wet` enquanto se desenha (exceção: a folha Mais do #006,
  que só existe com a caneta parada).
- **Pronto quando:**
  - [ ] papel ocupa a tela inteira no tablet (2160×1440)
  - [ ] painel Teste da Fase 0 continua dizendo "baixa latência: sim"
  - [ ] desenhar, laço e mover funcionam como antes
- **Arquivos prováveis:** `index.html`, `styles.css`, `src/main.js`, `src/input/input.js`, novo `src/ui/wheel.js`
- **Resposta do VS Code:** _(preenchido pelo VS Code)_

### #002 — Roda recolhida (botão de canto)
- **Status:** A fazer · **Prioridade:** P1 · **Versão alvo:** 0.2.0
- **Origem:** pedido do Raphael
- **Problema:** sem a zona lateral, os controles precisam caber num ponto pequeno e escondível.
- **O que fazer:**
  - círculo de 64 px a 16 px do canto inferior esquerdo (direito no modo Canhoto), desenhado no `#ui`;
  - mostra: cor da tinta ativa no miolo, anel de pontos com o frame atual aceso, traço fino quando parado;
  - toque = abre a roda (#003); segurar 0,4 s e arrastar = move para outro canto, encaixando no mais próximo
    dos 4 cantos; o canto escolhido fica salvo nas configurações.
- **Não fazer:** não abrir a roda ao soltar depois de arrastar.
- **Pronto quando:**
  - [ ] o botão mostra tinta, frame e estado em tempo real
  - [ ] arrastar leva para qualquer canto e o canto é lembrado depois de recarregar
  - [ ] no modo Canhoto, o canto padrão é o inferior direito
- **Arquivos prováveis:** `src/ui/wheel.js`, `src/doc/project.js` (configuração `wheelCorner`)
- **Resposta do VS Code:** _(preenchido pelo VS Code)_

### #003 — Roda aberta: centro, setores, prato e velocidade
- **Status:** A fazer · **Prioridade:** P1 · **Versão alvo:** 0.2.0
- **Origem:** pedido do Raphael
- **Problema:** o tempo e os comandos principais precisam estar na roda.
- **O que fazer:**
  - roda de 240 px de diâmetro encaixada no canto, sem sair da tela;
  - centro (raio 36): toque = tocar/pausar;
  - anel do meio (raio 36–80): 6 setores na ordem Desfazer, Refazer, Tinta, Ferramenta, Camadas, Mais;
  - anel externo (raio 80–120): prato do tempo com os pontos dos frames; mesmo comportamento da roda atual
    (encostar segura o loop com `clock.holds`, 30° = 1 frame);
  - arco de velocidade de 60° fora do prato: −2× a 2×, encaixa em 1×, toque duplo volta a 1×;
  - leitura passageira no centro por 1,5 s ao mudar algo (textos do doc 11);
  - recolhe quando a caneta começa a desenhar ou um dedo toca o papel, salvo se "Fixar roda" estiver ligado;
  - animação de abrir e fechar de no máximo 150 ms, sem bloquear toques.
- **Não fazer:** recolher não pausa nem retoma o loop.
- **Pronto quando:**
  - [ ] todos os alvos de toque têm pelo menos 48 px no tablet
  - [ ] girar o prato com o polegar anda frame a frame; soltar retoma o loop
  - [ ] a roda recolhe ao desenhar e não recolhe com "Fixar roda" ligado
- **Arquivos prováveis:** `src/ui/wheel.js`, remover `src/ui/thumbzone.js` quando tudo migrar
- **Resposta do VS Code:** _(preenchido pelo VS Code)_

### #004 — Desfazer e Refazer
- **Status:** A fazer · **Prioridade:** P1 · **Versão alvo:** 0.2.0
- **Origem:** pedido do Raphael (qualidade de vida)
- **O que fazer:**
  - setores Desfazer e Refazer chamam `app.undo()` / `app.redo()`; leitura "Desfeito", "Refeito" ou
    "Nada para desfazer";
  - depois de Desfazer, o prato vira roda de histórico por 3 s (comportamento atual), com o anel em destaque e
    a leitura "Histórico";
  - toque rápido de 2 dedos no papel continua desfazendo;
  - setores ficam apagados (50 % de opacidade) quando não há o que desfazer/refazer.
- **Pronto quando:**
  - [ ] desfazer e refazer funcionam pela roda e pelos 2 dedos
  - [ ] setores apagados quando a pilha está vazia
- **Arquivos prováveis:** `src/ui/wheel.js`, `src/doc/history.js` (expor `canUndo`/`canRedo`)
- **Resposta do VS Code:** _(preenchido pelo VS Code)_

### #005 — Pétalas de Tinta e Ferramenta; botões da caneta
- **Status:** A fazer · **Prioridade:** P2 · **Versão alvo:** 0.2.0
- **Origem:** pedido do Raphael
- **O que fazer:**
  - pétala é um arco de pastilhas fora da roda; some ao escolher ou ao tocar fora;
  - Tinta: as 4 tintas; toque = ativa; toque longo = escolher outra cor para aquela tinta;
  - Ferramenta: Pincel, Borracha (o antigo Recorte), Laço (modo fixo, alternativa ao botão da caneta) e um
    arco de tamanho com prévia do círculo no papel;
  - botões da caneta: botão lateral que reporta `buttons & 2` segura a Borracha; se a caneta reportar um
    segundo botão (ver valor no Teste da Fase 0), ele segura o Laço; se não reportar, o Laço fica só na roda.
- **Pronto quando:**
  - [ ] trocar tinta e ferramenta leva no máximo 2 toques a partir da roda recolhida
  - [ ] segurar o botão da caneta apaga; soltar volta ao Pincel
- **Arquivos prováveis:** `src/ui/wheel.js`, `src/input/input.js`
- **Resposta do VS Code:** _(preenchido pelo VS Code)_

### #006 — Folha "Mais" e chips de seleção
- **Status:** A fazer · **Prioridade:** P2 · **Versão alvo:** 0.2.0
- **Origem:** pedido do Raphael
- **O que fazer:**
  - setor Mais abre uma folha compacta perto da roda (pode ser HTML) com: Grão, Desalinhamento, Ferver,
    Papel, Fixar roda, Canhoto, Teste da Fase 0, Exportar PNG, Novo projeto; fecha ao tocar fora;
  - o painel Teste da Fase 0 passa a flutuar no canto oposto à roda, pequeno, sem cobrir o centro do papel;
  - com seleção ativa, desenhar no `#ui` dois chips junto da caixa: "Duplicar →" e "Apagar";
  - setor Camadas abre, por enquanto, FPS e quantidade de frames da camada ativa (o painel completo é da v0.4).
- **Pronto quando:**
  - [ ] todos os ajustes da v0.1 continuam acessíveis
  - [ ] chips seguem a seleção quando ela é movida
- **Arquivos prováveis:** `src/ui/wheel.js`, novo `src/ui/sheet.js`, `src/ui/debug.js`
- **Resposta do VS Code:** _(preenchido pelo VS Code)_

### #007 — Textos e teste automático
- **Status:** A fazer · **Prioridade:** P2 · **Versão alvo:** 0.2.0
- **O que fazer:**
  - aplicar o vocabulário e os textos de `docs/11-textos-da-interface.md` (Recorte → Borracha, mensagens de
    erro e confirmação);
  - atualizar `tests/smoke_test.py` para a roda: abrir, girar o prato, desfazer/refazer, trocar tinta, mover de
    canto, recolher ao desenhar;
  - escrever `docs/adr/ADR-002-interface-em-canvas.md` (interface desenhada no `#ui`, por baixo do traço).
- **Pronto quando:**
  - [ ] teste automático passa
  - [ ] nenhum texto da interface fora do vocabulário do doc 11
- **Resposta do VS Code:** _(preenchido pelo VS Code)_

## Dúvidas do VS Code

_Perguntas que travaram um pedido. O Raphael leva para o chat, e a resposta volta como edição do pedido._

### D1 — #001: `desynchronized` deixa a camada de cima preta no tablet (bloqueia #001 a #007)
- **Achado no tablet (23/11):** no Chrome do Android, um canvas 2D com `desynchronized: true` não tem
  transparência: o que é vazio fica **preto** e esconde o que está embaixo. Foi a causa da tela preta da v0.1
  (confirmado pelo teste 6 do `diag.html`: listra azul sobre fundo preto). Hoje a v0.1 roda com o modo
  desligado (liga só com `?baixa=1`).
- **Conflito:** o #001 pede `#wet` por cima de `#gl` e `#ui` **e** com `desynchronized`, e o "Pronto quando" pede
  "baixa latência: sim". No tablet, essas duas coisas juntas dão tela preta.
- **Opções:**
  - **A (recomendada para destravar):** fazer o #001 com `#wet` transparente e **sem** `desynchronized`, como a
    v0.1 que funciona. Trocar o critério para "o papel aparece e o traço acompanha a caneta". A baixa latência
    volta num pedido próprio, depois de medir a latência (Fase 0, parte 3, com o `teste-caneta.html`).
  - **B:** inverter as camadas: um único canvas opaco no topo, com `desynchronized`, que desenha o papel, a
    interface e o traço molhado. Exige mudar o compositor (o traço molhado passa a ser desenhado no WebGL ou o
    riso passa a ser copiado para o canvas do topo). Mais trabalho e risco; decisão de arquitetura (ADR-002).
  - **C:** medir antes. Se a latência sem `desynchronized` já ficar < 50 ms e com sensação ≥ 4, a opção A vira
    definitiva e o problema some.
- **Status:** aguardando o Raphael/chat. O VS Code parou no #001.

## Feitos

_Pedidos concluídos, com a resposta do VS Code._
