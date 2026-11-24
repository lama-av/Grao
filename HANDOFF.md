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
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.2.0
- **Origem:** pedido do Raphael (interface mínima, sem aba fixa)
- **Problema:** a zona do polegar ocupa uma faixa fixa do lado e diminui o papel.
- **O que fazer:**
  - remover a `aside#thumb`; o palco 3:2 ocupa a tela inteira (letterbox só se a tela não for 3:2);
  - empilhar três canvases: `#gl` (riso) → `#ui` (canvas 2D comum, para roda, chips e caixa da seleção) →
    `#wet` (traço molhado, continua no topo, transparente e **sem** `desynchronized`; ver D1);
  - `#wet` recebe todos os eventos; criar um ponto único de "hit test" que entrega à roda os toques que caem na
    área dela e ao papel o resto;
  - a caixa tracejada da seleção passa a ser desenhada no `#ui` (o `#wet` fica só para o traço e o laço).
- **Não fazer:** nenhum elemento HTML por cima do `#wet` enquanto se desenha (exceção: a folha Mais do #006,
  que só existe com a caneta parada).
- **Pronto quando:**
  - [ ] papel ocupa a tela inteira no tablet (2160×1440)
  - [ ] o papel aparece no tablet e o traço acompanha a caneta (sem baixa latência; ver D1)
  - [ ] desenhar, laço e mover funcionam como antes
- **Arquivos prováveis:** `index.html`, `styles.css`, `src/main.js`, `src/input/input.js`, novo `src/ui/wheel.js`
- **Resposta do VS Code (23/11):**
  - Papel em tela cheia (3:2; letterbox só fora de 3:2). Três canvases: `#gl` → `#ui` → `#wet`. A `aside#thumb` e
    `src/ui/thumbzone.js` saíram.
  - `#wet` recebe tudo; `app.ui.down(e)` é o ponto único de teste de acerto; o resto vai ao papel. Caixa da
    seleção desenhada no `#ui`; o `#wet` guarda só traço e laço.
  - `#wet` **sem** `desynchronized` (D1, opção A).
  - Arquivos: `index.html`, `styles.css`, `src/main.js`, `src/input/input.js`, novo `src/ui/wheel.js`.
  - **Testar no tablet:** Abrir https://lama-av.github.io/Grao/ (aviso deve dizer `0.1.0-b5`). O papel ocupa a tela toda; desenhar, laço e mover funcionam.

### #002 — Roda recolhida (botão de canto)
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.2.0
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
- **Resposta do VS Code (23/11):**
  - Botão de 64 px a 16 px do canto, desenhado no `#ui`: miolo com a tinta ativa, anel de pontos com o frame
    aceso, anel fino quando parado. Toque abre; segurar 0,4 s e arrastar mostra os 4 cantos e encaixa no mais
    próximo; não abre ao soltar. Configuração `wheelCorner` (null = automático: inferior esquerdo, ou
    inferior direito no Canhoto).
  - **Testar no tablet:** mover o botão para cada canto, recarregar e ver se ele continua lá; ligar Canhoto
    (com o canto ainda automático) e ver o botão ir para a direita.

### #003 — Roda aberta: centro, setores, prato e velocidade
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.2.0
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
- **Resposta do VS Code (23/11):**
  - Roda de 240 px encaixada no canto. Centro (raio 36) toca/pausa; 6 setores (raio 36–80) na disposição do
    desenho do doc 10 (Desfazer/Refazer em cima, Tinta à esquerda, Ferramenta à direita, Camadas/Mais embaixo);
    prato (80–120) com `clock.holds`, 30° = 1 frame; arco de velocidade de 60° fora do prato (126–174, 48 px de
    espessura), encaixa em 1× e 0×, toque duplo volta a 1×. Leitura no centro por 1,5 s. Recolhe ao desenhar ou
    ao tocar o papel, salvo com "Fixar roda". Abrir/fechar em 150 ms; os toques valem durante a animação.
  - **Observação:** pela especificação, o anel de setores tem 44 px de espessura e o prato 40 px; a área de cada
    alvo passa de 48×48 px porque os arcos são longos, mas a espessura fica abaixo de 48. Arco de velocidade,
    centro e pastilhas têm 48 px ou mais.
  - **Testar no tablet:** girar o prato com o polegar (anda frame a frame e solta ao tirar o dedo); deslizar no
    arco de velocidade; desenhar com a roda aberta (ela recolhe) e repetir com "Fixar roda" ligado.

### #004 — Desfazer e Refazer
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.2.0
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
- **Resposta do VS Code (23/11):**
  - Setores Desfazer/Refazer chamam `app.undo()/redo()`, que agora devolvem `true/false` e mostram "Desfeito",
    "Refeito", "Nada para desfazer" ou "Nada para refazer" (este último não está no doc 11; segue o mesmo
    padrão). Depois de Desfazer, o prato vira histórico por 3 s (anel rosa, leitura "Histórico"). 2 dedos
    continuam desfazendo (a leitura aparece ao lado do botão). Setores a 50 % sem o que desfazer/refazer.
    `History.canUndo/canRedo` expostos.
  - **Testar no tablet:** desfazer e refazer pela roda; tocar 2 dedos no papel; girar o prato logo após Desfazer.

### #005 — Pétalas de Tinta e Ferramenta; botões da caneta
- **Status:** Fazendo · **Prioridade:** P2 · **Versão alvo:** 0.2.0
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
- **Resposta do VS Code (23/11):**
  - **Feito:** pétala em arco de pastilhas (52 px), some ao escolher ou ao tocar fora. Tinta: 4 tintas, toque
    ativa, toque longo (0,5 s) abre as 8 cores para trocar a daquela tinta. Ferramenta: Pincel, Borracha (antigo
    Recorte), Laço fixo (com o Laço fixo, a caneta dentro da seleção move; fora, faz novo laço) e arco de
    Tamanho com prévia do círculo no centro do papel. Botão lateral que reporta `buttons & 2` segura a Borracha.
  - **Falta:** o segundo botão segurar o Laço. Depende do valor de "botões" medido no
    `teste-caneta.html` (Fase 0). O código já tem `app.lassoHeld` pronto para isso.
  - **Testar no tablet:** trocar tinta e ferramenta (2 toques a partir da roda recolhida); segurar o botão da
    caneta e riscar (apaga); soltar volta ao Pincel.

### #006 — Folha "Mais" e chips de seleção
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.2.0
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
- **Resposta do VS Code (23/11):**
  - Setor Mais abre `src/ui/sheet.js` ao lado da roda: Grão, Desalinhamento, Ferver, Papel, **Auto** (ajuste da
    v0.1 que não estava na lista; mantido para cumprir "todos os ajustes continuam acessíveis"), Fixar roda,
    Canhoto, Teste da Fase 0, Exportar PNG, Novo projeto. Fecha ao tocar fora.
  - Setor Camadas abre uma folha com FPS e quantidade de frames da camada ativa. A cor da tinta fica no toque
    longo da pétala Tinta. O tamanho do pincel foi para a pétala Ferramenta.
  - Painel Teste da Fase 0 flutua no canto oposto à roda, sem receber toques.
  - Chips "Duplicar →" e "Apagar" desenhados no `#ui` abaixo da caixa (ou acima, se não couber); seguem a
    seleção ao mover.
  - **Testar no tablet:** abrir cada ajuste da folha Mais; laçar algo e usar os chips; mover a seleção e ver os
    chips irem junto.

### #007 — Textos e teste automático
- **Status:** Fazendo · **Prioridade:** P2 · **Versão alvo:** 0.2.0
- **O que fazer:**
  - aplicar o vocabulário e os textos de `docs/11-textos-da-interface.md` (Recorte → Borracha, mensagens de
    erro e confirmação);
  - atualizar `tests/smoke_test.py` para a roda: abrir, girar o prato, desfazer/refazer, trocar tinta, mover de
    canto, recolher ao desenhar;
  - escrever `docs/adr/ADR-002-interface-em-canvas.md` (interface desenhada no `#ui`, por baixo do traço).
- **Pronto quando:**
  - [ ] teste automático passa
  - [ ] nenhum texto da interface fora do vocabulário do doc 11
- **Resposta do VS Code (23/11):**
  - **Feito:** textos do doc 11 aplicados (Borracha, erros de salvar/GPU/arquivo, confirmação de novo projeto,
    "PNG exportado", avisos de frames). `tests/smoke_test.py` reescrito para a roda (abrir, centro, prato,
    desfazer/refazer, tinta, borracha, recolher, mover de canto, 2 dedos, laço e chip, recarregar).
    `docs/adr/ADR-002-interface-em-canvas.md` escrito (status Aceito).
  - **Falta:** **o teste automático não foi rodado** nesta máquina (sem Playwright, e o navegador sem tela foi
    bloqueado pelas permissões do Claude Code). Para rodar: `pip install playwright`, `playwright install
    chromium` e `CHROME=<caminho do chrome> python tests/smoke_test.py`.
  - A confirmação de Novo projeto ainda usa a caixa do navegador (botões OK/Cancelar, não "Apagar e começar").

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
- **Resolvida (23/11, Raphael):** opção **A**. A v0.2 segue sem baixa latência; no teste do tablet o modo
  baixa latência nem funcionou. O #001 foi ajustado: `#wet` transparente, sem `desynchronized`.

## Feitos

_Pedidos concluídos, com a resposta do VS Code._
