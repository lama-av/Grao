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

> **Estado (24/11):** v0.2.0 testada no tablet. v0.2.1, v0.3.0 e v0.3.1 feitas, **ainda sem teste no tablet**.
>
> **Novo roteiro até a v1.0** (decidido no chat em 24/11, conselho de design): `docs/13-conselho-v0.3.md`.
> Ele substitui a ordem de versões do doc 10. Arquitetura dos gestos: `docs/adr/ADR-003-gestos-de-dois-dedos.md`.
>
> **Atualização (24/11, Raphael no VS Code):** "execute os pedidos até a versão 1.0, sem pausas". A v0.4 foi feita
> logo depois da 0.3.2, sem a auditoria; da 0.5 em diante os pedidos foram escritos pelo VS Code a partir do roteiro
> (doc 13) e estão abaixo, já com resposta. Relatório geral: `docs/relatorio-v1.0.md`.
>
> **Ordem original:** faça a **v0.3.2** (#022–#026, depois #034, por fim #027) e **PARE** no #027. A v0.4 (#028–#032) só começa quando o Raphael
> trouxer o resultado do teste no tablet e o chat liberar (o chat marca no topo desta fila: "v0.4 liberada").

### Roteiro até a v1.0

| Versão | Nome | Pedidos | Situação |
| --- | --- | --- | --- |
| 0.3.2 | Gestos, Vermelho vivo e auditoria | #022–#026, #034, #027 | **A fazer agora** (o #027 por último) |
| ⏸ | Teste no tablet + auditoria no chat | — | Raphael |
| 0.4.0 | Camadas, retícula e uso sem internet | #028–#033, #035, #032 | Escrita, **espera liberação** |
| 0.5.0 | Tempo: tira de frames com miniaturas, inserir/duplicar/apagar/mover frame, exposição, copiar e colar entre frames, papel-cebola configurável | o chat escreve depois da auditoria da 0.4 | Roteiro |
| 0.6.0 | Projetos: galeria, GIF, sequência de PNG (o uso sem internet foi para a 0.4) | idem | Roteiro |
| 0.7.0 | Riso completo: sobreimpressão por passada, desalinhamento que cresce com o número de passadas, formas de ponto da retícula, Prova de impressão, **separações por tinta em escala de cinza (preto 5–100%, 300–600 dpi), prontas para mandar à gráfica riso**, imperfeições opcionais (marcas de rolo, transferência de tinta) | idem | Roteiro |
| 0.8.0 | Primeira vez (projeto de boas-vindas), textos, acessibilidade, teste com 3 pessoas | idem | Roteiro |
| 0.9.0 | Beta: sessão de 1 h, meia resolução automática, correções | idem | Roteiro |
| 1.0.0 | Lançamento (critérios no doc 10) | — | Roteiro |

### #022 — Módulo de gestos de 2 dedos (sem mudar o comportamento)
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.3.2
- **Origem:** ADR-003
- **Problema:** a lógica de 2 dedos está espalhada no `input.js` (21 KB); o gesto novo de tempo e o filtro de palma
  precisam de um lugar próprio e testável.
- **O que fazer:**
  - criar `src/input/gestures.js`, máquina de estados pura (sem DOM), como no diagrama do ADR-003: DECIDINDO →
    TRANSFORMAR | DESFAZER | PAPEL (e TEMPO no #023);
  - limites em `config.js`: `GESTURE_DECIDE_PX = 24`, `PINCH_RATIO = 0.10`, `TAP_MS = 200`, `TAP_MOVE_PX = 12`;
  - `input.js` repassa os toques e executa a intenção; a intenção é decidida uma vez e não muda até os 2 dedos
    saírem.
- **Não fazer:** mudar o que o usuário sente hoje em TRANSFORMAR, PAPEL (pinça/arrastar com zoom) e DESFAZER.
- **Pronto quando:**
  - [ ] teste de lógica cobre os 3 caminhos atuais pela máquina e continua passando
  - [ ] `input.js` não tem mais regra de decisão de 2 dedos
- **Arquivos prováveis:** novo `src/input/gestures.js`, `src/input/input.js`, `src/config.js`, `tests/logic_test.mjs`
- **Resposta do VS Code (24/11, build b11):**
  - `src/input/gestures.js`: máquina pura (sem DOM), com os limites em `config.js`. O `input.js` só repassa os
    toques e executa as ações (`xf-begin`, `xf`, `pan-begin`, `pan`, `time-begin`, `scrub`, `undo`, `end`, `cancel`).
  - **Diferença do ADR:** a pinça não é decidida só por "distância mudou 10%". Os eventos chegam um dedo de cada vez;
    no teste, arrastar 2 dedos juntos virava pinça porque um dedo sempre sai na frente. Regra usada: depois de 24 px,
    é pinça se a distância mudou ≥ 10% **e** mais que metade do quanto o meio dos dedos andou. Pinça com um dedo
    parado continua sendo pinça (testado).
  - Teste: os 3 caminhos antigos, a palma e o cancelamento passam pela máquina (164 verificações no total).
  - **Testar no tablet:** os três gestos antigos (desfazer, zoom, girar a seleção) continuam iguais.

### #023 — Arrastar 2 dedos para os lados anda no tempo
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.3.2
- **Origem:** pedido do Raphael ("arrastar com 2 dedos para esquerda ou direita move na timeline, tal qual na rodinha")
- **O que fazer:**
  - intenção **TEMPO** na máquina do #022: os 2 dedos andam juntos (distância estável), o movimento é mais
    horizontal que vertical **e** o papel está em 100% (`isFit(view)`);
  - a cada `SCRUB_PX_PER_FRAME = 48` px horizontais acumulados: `clock.step(camada ativa, ±1)`; direita = para
    frente (mesmo sentido do prato girando no horário); pode andar vários frames num movimento rápido;
  - enquanto os dedos estão na tela: `clock.holds.add('scrub')`; ao soltar: remove (o loop retoma se não estava
    pausado); `pointercancel` volta ao frame de antes do gesto;
  - **régua de frames** no `#ui`: faixa fina na borda de baixo do papel, centralizada, com um tique por frame da
    camada ativa e o frame atual aceso; aparece no começo do gesto e some 400 ms depois de soltar;
  - leitura passageira "3/8" no botão da roda (mesmo texto da roda aberta);
  - com zoom, arrastar continua movendo o papel (PAPEL); a pinça continua dando zoom.
- **Não fazer:** inércia (o tempo não continua andando depois de soltar); usar a roda de histórico neste gesto.
- **Pronto quando:**
  - [ ] em 100%, arrastar 2 dedos 48 px para a direita avança 1 frame; para a esquerda volta 1
  - [ ] com zoom, o mesmo movimento move o papel
  - [ ] o loop fica parado durante o gesto e retoma ao soltar
  - [ ] a régua aparece e some; o teste de lógica cobre TEMPO, a fronteira com PAPEL e o cancelamento
- **Arquivos prováveis:** `src/input/gestures.js`, `src/input/input.js`, `src/ui/wheel.js` (régua e leitura), `src/config.js`
- **Resposta do VS Code (24/11, build b11):**
  - Intenção TEMPO: 2 dedos juntos, mais na horizontal, papel em 100%. 48 px = 1 frame (direita = para frente), vários
    frames num movimento rápido, sem inércia. `clock.holds 'scrub'` durante o gesto; cancelado volta ao frame de
    antes. Régua de frames no `#ui` (borda de baixo, centralizada, frame atual aceso com a cor da tinta), some 400 ms
    depois de soltar. Leitura "3/8" no botão da roda.
  - **Testar no tablet:** arrastar 2 dedos devagar e rápido; com zoom (deve mover o papel); na vertical (não anda).

### #024 — Palma não vira gesto
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.3.2
- **Origem:** ADR-003 (rejeição de palma fraca no XPPen)
- **O que fazer:**
  - filtro antes da máquina de gestos: ignorar um toque que começa com a caneta encostada, pairando ou que saiu há
    menos de `PEN_GUARD_MS = 300` ms;
  - ignorar toques com `width` ou `height` maior que `PALM_CONTACT_PX = 40` (quando o navegador informar);
  - toque ignorado fica ignorado até sair;
  - **exceção:** toques na área da roda (botão, roda aberta, pétalas, folhas) nunca são filtrados;
  - mostrar no painel Teste da Fase 0: "toques ignorados: N" e a largura/altura do último toque.
- **Pronto quando:**
  - [ ] desenhando com a palma apoiada, nenhum zoom, desfazer ou passo de tempo acontece por acidente
  - [ ] a mão livre usa a roda normalmente com a caneta perto da tela
- **Arquivos prováveis:** `src/input/gestures.js`, `src/input/input.js`, `src/ui/debug.js`
- **Resposta do VS Code (24/11, build b11):**
  - Filtro antes da máquina: caneta encostada, caneta pairando (eventos há menos de 1 s, sem ter saído) ou que saiu
    há menos de 300 ms; contato com `width`/`height` > 40 px. Ignorado fica ignorado até sair. A roda recebe o toque
    antes do filtro, então nunca é filtrada.
  - Painel Teste da Fase 0: "toques ignorados (palma): N" e "último toque: L × A px" (mostra se o Chrome informa o
    tamanho do contato; se aparecer sempre 1 × 1, o filtro de tamanho não vale neste tablet).
  - **Testar no tablet:** desenhar 2 min com a palma apoiada (nenhum zoom, desfazer ou passo de tempo); usar a roda
    com a mão livre enquanto a caneta paira.

### #025 — Item "Gestos" no Menu
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.2
- **Origem:** conselho (Norman): gestos de 2 dedos são invisíveis
- **O que fazer:**
  - item **Gestos** no Menu, na seção Desenho e roda; abre uma lista curta, sem imagens, com os textos de
    `docs/11-textos-da-interface.md` (seção "Gestos");
  - na primeira vez que o app abre depois da atualização, uma leitura de 3 s no botão da roda: "Novo: 2 dedos
    para os lados andam no tempo" (só uma vez por aparelho).
- **Pronto quando:**
  - [ ] a lista mostra os 4 gestos de 2 dedos e fecha ao tocar fora
- **Arquivos prováveis:** `src/ui/sheet.js`, `src/ui/wheel.js`
- **Resposta do VS Code (24/11, build b11):**
  - Menu → Desenho e roda → **Gestos**: folha com os 4 gestos e o rodapé da palma (textos do doc 11). Fecha ao tocar
    fora. Na primeira abertura da 0.3.2 no aparelho, leitura de 3 s no botão da roda: "Novo: 2 dedos para os lados
    andam no tempo".

### #026 — Pétala Ferramenta em dois arcos
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.2
- **Origem:** conselho (Rams): 7 ferramentas numa fila só
- **O que fazer:**
  - arco de dentro **Riscar**: Pincel, Lápis, Marcador, Giz; arco de fora **Mexer**: Borracha, Balde, Laço;
  - o arco de Tamanho continua e mostra o tamanho da ferramenta ativa;
  - rótulos dos arcos para leitor de tela: "Riscar" e "Mexer" (não precisam aparecer escritos se não couber).
- **Não fazer:** ferramenta nova; mudar o botão 1 da caneta.
- **Pronto quando:**
  - [ ] trocar qualquer ferramenta continua levando no máximo 2 toques da roda recolhida
  - [ ] todos os alvos com pelo menos 48 px
- **Arquivos prováveis:** `src/ui/wheel.js`
- **Resposta do VS Code (24/11, build b11):**
  - Arco de dentro (raio 206) **Riscar**: Pincel, Lápis, Marcador, Giz. Arco de fora (raio 270) **Mexer**: Borracha,
    Balde, Laço. Pastilhas de 52 px. O arco de Tamanho foi para 318–366 px, por fora dos dois. Rótulos "Riscar" e
    "Mexer" escritos ao lado de cada arco. Qualquer ferramenta continua a 2 toques da roda recolhida.

### #034 — Tinta Vermelho vivo (9ª cor da paleta)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.2
- **Origem:** pedido do Raphael (24/11), para permitir o "falso CMYK" da riso (Azul, Vermelho vivo, Amarelo, Preto).
- **O que fazer:**
  - acrescentar **no fim** de `INKS` em `config.js`: `{ name: 'Vermelho vivo', hex: '#F15060' }` (Riso Bright Red,
    Pantone 185 U; hex da Stencil Wiki/riso-colors, como as outras; o Risotrip usa `#DC424C` para simular a mesma
    tinta, fica anotado no doc 12). No fim para não mudar o índice das tintas dos projetos salvos;
  - o arco de cores da pétala Tinta passa a ter 9 cores, mantendo alvos de pelo menos 48 px (se não couber num
    arco, o arco cresce de ângulo; não diminuir os alvos);
  - `sanitize` aceita o índice 8; projeto de versão antiga continua abrindo igual.
- **Não fazer:** outras cores. **A paleta do Grão fecha em 9 tintas** (decisão de 24/11).
- **Pronto quando:**
  - [ ] Vermelho vivo escolhível em qualquer das 4 tintas; aparece certo na tela, no PNG e no vídeo
  - [ ] teste de lógica cobre o índice 8 no arquivo `.grao`
- **Arquivos prováveis:** `src/config.js`, `src/ui/wheel.js`, `src/doc/project.js`, `docs/12-tintas-riso.md`
- **Resposta do VS Code (24/11, build b11):**
  - `{ name: 'Vermelho vivo', hex: '#F15060' }` no fim de `INKS` (índice 8). Arco de cores com 9 pastilhas de 48 px
    (antes 44 px), 14° entre elas. `sanitize` aceita o índice 8; índice 9 volta ao padrão (testado).
  - **Testar no tablet:** Vermelho vivo numa tinta; a combinação Azul + Vermelho vivo + Amarelo + Preto; PNG e vídeo.

### #027 — Fechar a 0.3.2 e preparar o teste no tablet (PARE aqui)
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.3.2
- **O que fazer:**
  - `VERSION` 0.3.2, `CHANGELOG.md`, `INSTRUCOES.txt`, docx da versão;
  - escrever `docs/relatorio-v0.3.md` (como o da v0.2): o que mudou de 0.2.1 a 0.3.2, o que saiu diferente dos
    pedidos e um **roteiro de teste no tablet** com estes itens, cada um com espaço para "ok / problema":
    1. Menu: salvar e abrir `.grao`; 2. cores à vista na pétala Tinta; 3. balde (inclusive com linha de outra
    tinta); 4. linha reta; 5. exportar vídeo e abrir o arquivo; 6. zoom e mover o papel; 7. os 4 pincéis e a
    suavização; 8. gesto de tempo com 2 dedos; 9. palma apoiada desenhando por 2 min; 10. painel Teste da
    Fase 0: quadros/s desenhando, tempo do quadro ao usar o balde, toques ignorados; 11. Vermelho vivo e a
    combinação Azul + Vermelho vivo + Amarelo + Preto; 12. **latência do traço**: vídeo em câmera lenta do
    celular (240 fps) com o `teste-caneta.html`, contando os quadros entre a ponta e o traço. Este item decide o
    ADR-001 (web ou nativo) antes da v0.4, que pesa mais na GPU. Anotar também os números de desempenho de hoje
    (base para comparar a v0.4).
  - **Depois disso, pare.** Não comece o #028.
- **Pronto quando:**
  - [ ] relatório e roteiro escritos; docx da 0.3.2 gerado
- **Resposta do VS Code (24/11, build b11):**
  - `VERSION` 0.3.2, CHANGELOG, INSTRUCOES, docx e `docs/relatorio-v0.3.md` com o roteiro de 12 itens.
  - **Não parei aqui:** o Raphael pediu (24/11) "execute os pedidos até a versão 1.0, sem pausas". A v0.4 e as
    seguintes foram feitas em seguida; ver as respostas de cada pedido e `docs/relatorio-v1.0.md`.

### #028 — Camadas separadas das tintas (modelo e migração)
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.4.0
- **Origem:** doc 10 (T-030, T-034), doc 13 (decisão 6)
- **O que fazer:**
  - o projeto tem **4 tintas** (`project.inks`, os "tambores", cada uma com uma das 8 cores) e **até 8 camadas**;
  - cada camada: `ink` (0–3), `fps`, `frames`, `visible`, `locked`, `screen` (ver #030), `name` opcional;
  - ordem de impressão = ordem das camadas (a de baixo imprime primeiro); o compositor junta as camadas por tinta;
  - migração: projetos antigos abrem com 4 camadas, cada uma com a sua tinta, sem mudança visual;
  - o desfazer cobre criar, apagar, reordenar, trocar tinta, visível e travar (T-033);
  - camada travada não aceita traço, balde nem seleção (leitura "Camada travada").
- **Pronto quando:**
  - [ ] projeto da 0.3.x abre igual
  - [ ] 8 camadas com 4 tintas desenham, tocam e exportam
  - [ ] teste de lógica cobre migração, limites (8 camadas, 4 tintas) e desfazer de camadas
- **Arquivos prováveis:** `src/doc/project.js`, `src/render/riso/*`, `src/render/masks.js`, `src/schedule.js`, `src/actions.js`
- **Resposta do VS Code (24/11, build b12):**
  - `project.inks` (4 tambores, índices de INKS) + 1 a 8 camadas `{ id, ink: 0–3, fps, frames, visible, locked,
    screen, name? }`. Arquivo versão 2; a versão 1 migra sem mudança visual (cores das camadas viram as dos tambores).
  - Compositor: até 8 camadas numa passada; camadas da mesma tinta se juntam pelo máximo; tintas multiplicam.
    Máscaras por **id da camada** (ADR-004): reordenar, esconder, trocar tinta e desfazer não refazem máscaras.
  - Desfazer de camadas por retrato `{ type: 'layers', before, after }` (criar, apagar, reordenar, duplicar, tinta,
    cor do tambor, visível, travar, retícula). Camada travada: "Camada travada" e nada acontece.
  - A última camada não pode ser apagada ("A última camada não pode ser apagada.", texto novo no doc 11).
  - **Testar no tablet:** abrir um projeto da 0.3.x (igual); criar até 8 camadas; desenhar em várias; tocar e exportar.

### #029 — Setor "Camadas" na roda
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.4.0
- **O que fazer:**
  - o setor **Tinta** vira **Camadas** (mesma posição);
  - pétala Camadas: arco de pastilhas, uma por camada, de baixo para cima na ordem de impressão, cada uma pintada
    com a cor da sua tinta; pastilha apagada = camada invisível; cadeado pequeno = travada; toque = ativa;
    último item "+" cria camada (some com 8);
  - **toque longo numa pastilha** abre a folha da camada (HTML, só com a caneta parada): Tinta (as 4 do projeto,
    com o arco das 9 cores para trocar a cor do tambor, como hoje), Retícula (#030), Visível, Travar, Subir,
    Descer, Duplicar camada, Apagar camada (com confirmação se tiver desenho);
  - o botão da roda recolhida continua mostrando a cor da tinta da camada ativa;
  - Menu → Impressão → **Tintas prontas**: "Falso CMYK" (Azul, Vermelho vivo, Amarelo, Preto) e "Do projeto"
    (volta ao que estava); trocar as tintas entra no desfazer e não mexe nos desenhos.
- **Pronto quando:**
  - [ ] criar, ativar, esconder, travar, reordenar e apagar camada pela roda em até 2 toques (+ toque longo para a folha)
  - [ ] textos conforme o doc 11
- **Arquivos prováveis:** `src/ui/wheel.js`, `src/ui/sheet.js`
- **Resposta do VS Code (24/11, build b12):**
  - Setor **Camadas** (posição do antigo Tinta). Pétala: uma pastilha por camada, de baixo para cima na ordem de
    impressão, com a cor da tinta e o número; apagada e tracejada = invisível; cadeado = travada; "+" cria (some com 8).
    Por fora, o arco das 9 cores troca a cor da tinta (tambor) da camada ativa.
  - **Toque longo** numa camada: folha da camada (HTML): Tinta (4 tambores + 9 cores do tambor), Retícula
    (Estocástica · Reticulada · Densidade), Visível, Travar, Subir, Descer, Duplicar camada, Apagar camada (confirma
    se tiver desenho, texto do doc 11).
  - Menu → Impressão → **Tintas prontas**: Falso CMYK e Do projeto (no desfazer).
  - **Testar no tablet:** criar, ativar, esconder, travar, reordenar e apagar pela roda e pela folha.

### #030 — Retícula por camada: estocástica e reticulada
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.4.0
- **Origem:** pedido do Raphael ("existem 2 tipos de retícula quando trabalhando em riso, a estocástica e a
  reticulada, isso também deve ser implementado"); doc 13 (decisão 7)
- **O que fazer:**
  - `layer.screen = { type: 'stochastic' | 'am', density: 0.05..1 }`; padrão `stochastic`, `density` 1;
  - **Estocástica** (padrão): pontos espalhados ao acaso, como o grão atual; `density` define quantos pontos de
    tinta sobram (100% = área cheia com o grão de hoje; 30% = tom claro pontilhado). Os pontos acompanham o
    "ferver";
  - **Reticulada:** pontos redondos em grade; tamanho do ponto proporcional à densidade; **ângulo por tinta**
    (padrão: tinta 1 = 15°, 2 = 75°, 3 = 0°, 4 = 45°, para o moiré típico de riso); **lineatura do projeto** em
    pontos por polegada do documento impresso em A4 (padrão 60 lpi, opções 40 / 60 / 85 no Menu → Impressão);
    a grade é medida em unidades do documento (acompanha o zoom, como o grão); o desalinhamento por tinta continua
    valendo;
  - shader: uma função de retícula por tipo, escolhida por uniforme por camada; a máscara continua R8 (a retícula é
    aplicada no compositor, não salva nos traços);
  - folha da camada: "Retícula" com dois botões (Estocástica · Reticulada) e um controle "Densidade" (5–100%, como as gráficas riso pedem os arquivos);
  - **comportamento da riso de verdade nas pontas da densidade** (fontes: Secret Riso Club e Risotrip):
    - abaixo de 10% a riso falha: os pontos somem de forma irregular. Nas duas retículas, abaixo de 10% uma parte
      dos pontos cai ao acaso (muda com o "ferver");
    - áreas cheias imprimem irregulares: a variação de cobertura do filme começa a crescer em 50% e fica forte
      acima de 85% (cobertura desigual, variação de tom);
  - **desalinhamento calibrado:** o papel do Grão equivale a um A4 deitado (1200 unidades = 297 mm). A riso aceita
    2 a 3 mm de variação entre cores; o controle Desalinhamento no máximo passa a deslocar até 3 mm (≈ 12 unidades
    do documento), e o padrão (0,5) fica em ~1,5 mm;
  - **sem moiré de pixel:** a 60 lpi num A4 a retícula tem ~700 pontos na largura e a tela tem 2160 px (≈3 px por
    ponto em 100%). Desenhar o ponto com borda suavizada (`fwidth` no shader); se ainda criar moiré com os pixels
    da tela em 100%, anotar em Dúvidas com print, sem inventar solução visual;
  - PNG e vídeo exportados mostram a retícula igual à tela em 100%.
- **Não fazer:** formas de ponto (linha, elipse), lineatura por camada, ângulo editável (ficam para a v0.7).
- **Pronto quando:**
  - [ ] as duas retículas aparecem no tablet sem passar de 8 ms no compositor (medir no painel)
  - [ ] duas camadas reticuladas de tintas diferentes mostram ângulos diferentes
  - [ ] densidade 10% fica clara e legível nas duas retículas
- **Arquivos prováveis:** `src/render/riso/riso.frag`, `src/render/riso/riso.js`, `src/doc/project.js`, `src/ui/sheet.js`, `docs/05-motor-riso.md`
- **Resposta do VS Code (24/11, build b12):**
  - Shader: função de cobertura com dois tipos. **Estocástica:** o grão de antes; a densidade remove cachos de tinta.
    **Reticulada:** grade girada (15°, 75°, 0°, 45° por tambor), ponto redondo de área = tom × densidade; célula pela
    lineatura do projeto (40/60/85 lpi num A4 → ~2,4 / 1,7 / 1,2 unidades do documento).
  - Abaixo de 10% caem até 60% dos pontos ao acaso (muda com o ferver); áreas cheias ficam irregulares de 50% a 95%.
  - **Sem moiré de pixel:** a borda do ponto é suavizada em meio pixel por um uniforme (`uPxDoc`), sem `fwidth` (as
    derivadas dentro de desvios são indefinidas no GLSL ES); ponto menor que um pixel desbota em vez de escurecer.
    **Não foi possível ver na tela aqui:** se houver moiré em 100%, mandar print (Dúvidas).
  - Desalinhamento: máximo de 3 mm num A4 (1200 unidades = 297 mm); padrão 0,5 = ~1,5 mm.
  - **Testar no tablet:** as duas retículas em 100%, 10% e 5%; duas camadas reticuladas de tintas diferentes (ângulos
    diferentes); painel: compositor ≤ 8 ms com 4 e com 8 camadas.

### #031 — Tempo por camada (polimetria)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.4.0
- **O que fazer:** a folha Tempo mostra FPS e frames **da camada ativa** (hoje é da tinta ativa); o prato, a régua
  do #023 e o gesto de tempo andam na camada ativa; a leitura mostra o nome ou número da camada junto ("C2 · 3/8")
  quando houver mais de 4 camadas.
- **Pronto quando:** [ ] duas camadas com loops de tamanhos diferentes tocam juntas e o gesto de tempo anda na ativa
- **Resposta do VS Code (24/11, build b12):**
  - Folha Tempo mostra "Tempo da camada N · Tinta"; prato, régua e gesto andam na camada ativa; com mais de 4 camadas
    a leitura é "C2 · 3/8". Polimetria funciona como antes (cada camada com fps e frames próprios).

### #033 — Balde com trapping (avança por baixo da linha)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.4.0
- **Origem:** Risotrip: com o desalinhamento de 2 a 3 mm, gráficas usam "trapping" (uma cor invade um pouco a
  vizinha) para não aparecer filete branco entre as cores.
- **Problema:** o balde para exatamente na linha. Quando a linha é de outra tinta e o desalinhamento desloca as
  tintas, aparece um filete de papel entre a linha e o preenchimento.
- **O que fazer:**
  - o preenchimento do balde cresce **0,5 mm (≈ 2 unidades do documento) por baixo das linhas que o seguraram**,
    só por cima de pixels de linha, nunca vazando para fora da área;
  - vale para paredes da mesma tinta e de outras tintas;
  - Menu → Impressão: "Trapping" ligado por padrão (desligar mostra o filete, que também é um efeito de riso).
- **Pronto quando:**
  - [ ] com desalinhamento no máximo, linha preta + preenchimento rosa não mostram filete branco
  - [ ] desligado, o filete aparece; o preenchimento continua sem vazar
- **Arquivos prováveis:** `src/render/fill.js`, `src/render/masks.js`, `src/ui/sheet.js`
- **Resposta do VS Code (24/11, build b12):**
  - `floodFill(..., trap)`: depois de crescer até a linha, o preenchimento avança mais 2 px da máscara (≈ 0,5 mm) só
    por cima de pixels de linha (da própria camada e das outras); nunca para o outro lado. Menu → Impressão →
    **Trapping** (ligado por padrão); mudar refaz os baldes. Testado com linha grossa de outra camada.

### #035 — Abrir sem internet (service worker)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.4.0
- **Origem:** revisão do conselho (24/11): o Grão já é usado no tablet pelo GitHub Pages; sem rede ele não abre.
  Era o T-053 da v0.6, trazido para cá.
- **O que fazer:**
  - service worker que guarda todos os arquivos do app (lista gerada a partir da `VERSION`);
  - versão nova publicada: o app baixa em segundo plano e mostra no botão da roda "Nova versão. Toque para
    atualizar." só quando o loop estiver parado; nunca recarrega sozinho;
  - nada muda para os desenhos (continuam no IndexedDB do aparelho).
- **Pronto quando:**
  - [ ] no tablet, com o Wi-Fi desligado, o app instalado abre e desenha
  - [ ] uma versão nova aparece depois de tocar no aviso, sem perder o desenho
- **Arquivos prováveis:** novo `sw.js` na raiz, `src/main.js`, `manifest.webmanifest`
- **Resposta do VS Code (24/11, build b12):**
  - `sw.js` na raiz: guarda os arquivos do app (lista no próprio arquivo; o teste de lógica confere que está completa e
    que a versão bate com `VERSION-BUILD`). Primeiro o guardado, depois a rede. Só em https (GitHub Pages) ou localhost.
  - Versão nova: baixa em segundo plano; com o loop parado e a roda recolhida aparece no botão da roda **"Nova versão.
    Toque para atualizar."**; tocar salva e recarrega. Nunca recarrega sozinho.
  - **A cada versão:** atualizar `VERSION` no `sw.js` (regra anotada no `CLAUDE.md`).
  - **Testar no tablet:** abrir o app instalado com o Wi-Fi desligado; publicar uma versão nova e ver o aviso.

### #032 — Fechar a 0.4.0 (PARE aqui)
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.4.0
- **O que fazer:** depois do #033 e do #035: `VERSION` 0.4.0, CHANGELOG, `INSTRUCOES.txt`, docx, `docs/relatorio-v0.4.md` com roteiro de
  teste (camadas, retículas, polimetria, desempenho com 8 camadas). Atualizar `docs/05-motor-riso.md` com a
  retícula. Parar e esperar a auditoria.
- **Resposta do VS Code (24/11, build b12):**
  - `VERSION` 0.4.0, CHANGELOG, INSTRUCOES, docx, `docs/relatorio-v0.4.md`, doc 05 com a retícula, ADR-004.
  - Não parei (pedido do Raphael): segui para a 0.5.

---

### Pedidos já feitos (v0.2.0 a v0.3.1)

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
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.2.0
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
  - **Fechado em 24/11 pelo #009:** o Raphael mudou o comportamento dos botões (botão 1 **alterna** Pincel e
    Borracha; botão 2 **segura** o Laço). Ver #009.
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
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.2.0
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
- **Resposta do VS Code (24/11, fechamento da v0.2.0):**
  - Caixa de confirmação própria (`src/ui/dialog.js`): "Começar um projeto novo? O desenho atual será apagado
    deste aparelho." · **Apagar e começar** (vermelho) · **Cancelar**.
  - Novo `tests/logic_test.mjs`: roda sem navegador, com o Node que vem dentro do VS Code, e testa as regras
    (caneta, botões, laço, roda, pétalas, 2 dedos). **42 verificações passando.** O `smoke_test.py` (Playwright,
    com GPU) continua sem rodar aqui; a parte visual fica com o tablet.

### #008 — Pétalas não respondem a "encostar e arrastar"
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.2.0
- **Origem:** teste do Raphael no tablet (24/11): "na sessão de cores, a roda de opções, mesmo clicando e
  arrastando, não funciona".
- **Problema:** as pastilhas só aceitavam toque parado. Encostar em Tinta e arrastar até uma tinta, ou fazer o
  toque longo e arrastar até a cor nova, não fazia nada ao soltar.
- **Resposta do VS Code (24/11, build b6):**
  - Encostar em **Tinta** ou **Ferramenta** já abre a pétala; arrastar até a pastilha e soltar escolhe. A
    pastilha sob o dedo ganha um anel de destaque. Depois do toque longo numa tinta, arrastar até a cor e
    soltar troca a cor. Tocar e tocar continua funcionando como antes.
  - Arquivo: `src/ui/wheel.js`. Teste automático não rodado (mesmo motivo do #007).
  - **Testar no tablet:** encostar em Tinta, arrastar até outra tinta e soltar; toque longo numa tinta, arrastar
    até uma cor e soltar; tocar em Ferramenta e tocar em Borracha.

### #009 — Botões da caneta: alternar Pincel/Borracha e segurar o Laço
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.2.0
- **Origem:** pedido do Raphael (24/11): "um botão da caneta trocar entre brush e borracha e o outro para o lasso".
- **Resposta do VS Code (24/11, build b7):**
  - **Botão lateral 1** (o Chrome reporta `buttons & 2`): cada aperto **alterna** Pincel ↔ Borracha, com a caneta
    no ar ou encostada. Leitura "Borracha"/"Pincel" perto do botão da roda. Apertar durante um traço não corta o
    traço: vale para o próximo.
  - **Botão lateral 2** (`buttons & 4` ou `& 32`, conforme o aparelho; o valor exato do tablet não foi medido):
    **segura o Laço** enquanto está apertado, e o loop congela (decisão 8). Encostar a ponta com o botão apertado
    chega ao app como `pointermove`, não `pointerdown`; o `input.js` trata isso.
  - Com a caneta no ar, apertar um botão **não** mexe na roda nem no papel (antes podia começar um traço no ar).
  - O botão recolhido da roda mostra a ferramenta: miolo cheio = Pincel, vazado = Borracha, tracejado = Laço.
  - Arquivos: `src/input/input.js`, `src/ui/wheel.js`. Teste: `tests/logic_test.mjs` (botão 1, botão 2 com 4 e
    com 32, ponta encostando depois do botão, caneta saindo do alcance).
  - **Decisão 1 ("um gesto, uma função"):** o botão 1 virou alternância, que é um estado. Para não ficar
    escondido, o estado aparece no botão da roda. Se o chat preferir "segurar", é uma linha no `input.js`.
  - **Testar no tablet:** apertar o botão 1 no ar e riscar (apaga); apertar de novo e riscar (desenha); segurar o
    botão 2, encostar e contornar (laço); soltar o botão 2 (volta ao normal). Se o botão 2 não fizer nada, rodar
    o `teste-caneta.html` e mandar o valor de "botões".

### #010 — Menu principal e arquivo `.grao`
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.2.1
- **Origem:** D3 (Raphael, 24/11: "a falta de um menu principal me incomoda"). Desenho feito pelo VS Code, a
  pedido do Raphael ("continue a produção"); o chat pode revisar.
- **Resposta do VS Code:**
  - O setor "Mais" virou **Menu**. Topo: nome do projeto, estado do salvamento ("Salvo neste aparelho às 14:32"),
    **Salvar arquivo**, **Abrir arquivo**, **Novo projeto**, **Exportar PNG**. Embaixo, agrupados: Impressão e
    Desenho e roda.
  - Salvar arquivo baixa `Nome-do-projeto.grao` (JSON só com traços). Abrir arquivo usa o seletor do Android (sem
    filtro de tipo, porque o Android esconde extensões desconhecidas), confere o arquivo e pergunta: "Abrir “nome”?
    O desenho atual será trocado. Salve um arquivo antes, se quiser guardar." · **Abrir** · **Cancelar**.
  - `sanitize` passou a conferir cada campo (traço estragado sai, valores fora da faixa voltam ao padrão).
  - Arquivos: `src/ui/sheet.js`, novo `src/io/file.js`, `src/doc/project.js`, `src/main.js`, `styles.css`.
  - **Testar no tablet:** dar nome, Salvar arquivo e achar o `.grao` em Downloads; Novo projeto; Abrir arquivo e
    escolher o `.grao` (o desenho volta); tentar abrir uma foto (aviso de erro, nada muda).

### #011 — Cores à vista na pétala Tinta
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.2.1
- **Origem:** D3 (Raphael: "as cores ficam escondidas, não fica fácil identificar que tem mais que 4 cores").
- **Resposta do VS Code:**
  - Pétala Tinta = 2 arcos: perto, as **4 tintas** (rótulo "Tintas"); fora, as **8 cores** possíveis para a tinta
    ativa (rótulo "Cor da tinta", pastilhas de 44 px). Tocar numa cor troca a cor da tinta ativa e a pétala fica
    aberta. Um ponto escuro marca a cor que outra tinta já usa. O limite de 4 tintas por projeto continua.
  - O toque longo numa tinta continua abrindo as cores daquela tinta (atalho).
  - Arquivo: `src/ui/wheel.js`.
  - **Testar no tablet:** abrir Tinta e ver os 2 arcos; tocar em outra cor (a tinta muda e a pétala continua);
    tocar em outra tinta (ativa e fecha).

### #012 — "Camadas" vira "Tempo"
- **Status:** Feito · **Prioridade:** P3 · **Versão alvo:** 0.2.1
- **Origem:** Raphael (24/11): "não entendi o sistema de camadas, não são camadas de fato". Recomendação da D2.
- **Resposta do VS Code:** setor e folha renomeados para **Tempo**. A folha diz "Tempo da tinta Rosa flúor",
  mostra FPS, frames e a duração do loop ("1 s"), e explica que cada tinta tem o próprio loop. Quando as camadas
  de verdade chegarem (v0.4), o nome volta a ser discutido.

### #013 — Dica de 2 dedos na seleção
- **Status:** Feito · **Prioridade:** P3 · **Versão alvo:** 0.2.1
- **Origem:** Raphael perguntou se dava para girar e escalar a seleção; já dava, mas ninguém descobre (D2).
- **Resposta do VS Code:** junto dos chips aparece "2 dedos sobre a seleção: girar e escalar" nas 5 primeiras
  seleções feitas neste aparelho (contagem guardada no navegador).

### #014 — Balde (T-022)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.0
- **Origem:** pedido do Raphael (24/11: "balde de tinta") e plano da v0.3.
- **Resposta do VS Code:**
  - Ferramenta **Balde** na pétala Ferramenta (Pincel, Borracha, Balde, Laço). Um toque preenche a área fechada com
    a tinta da camada. Linhas com falhas de até ~4 px não vazam. Tocar em cima de uma linha não faz nada; tocar no
    papel vazio pinta o frame inteiro (desfazer volta).
  - **Linhas de outras tintas seguram o balde** (linha numa tinta, preenchimento em outra, como na gráfica). As
    paredes vêm do frame de cada outra tinta que aparece no meio do tempo desse frame (primeira volta do loop); se
    essas linhas mudam, ou o FPS/frames mudam, o balde é refeito. Tocar em cima de uma linha: "Nada para pintar".
  - Guardado como `{ kind: 'fill', pts: [x, y, 1] }` (decisão 4: só traços). A área é calculada na máscara
    (`src/render/fill.js`, na ordem dos traços). Mover/duplicar as linhas leva o preenchimento junto; o laço pega
    o balde pelo ponto tocado.
  - Custo medido no PC: ~15 ms por balde numa máscara 960×640; no tablet deve ficar entre 3 e 5 vezes mais. A máscara
    só refaz os baldes quando algo antes deles muda (traço novo no fim desenha só o novo).
  - Botão da roda: miolo quadrado = Balde.
  - **Testar no tablet:** desenhar um círculo fechado e tocar dentro com o Balde; um com uma falha pequena; mover o
    círculo com o laço (o preenchimento vai junto); "Duplicar →" e ver o preenchimento no próximo frame; medir se o
    loop engasga ao tocar com o balde (painel Teste da Fase 0).

### #015 — Linha reta (T-023)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.0
- **Origem:** pedido do Raphael ("linha") e plano da v0.3 (segurar 0,5 s endireita).
- **Resposta do VS Code:** durante o traço, se a caneta fica parada (tremida de até 4 unidades) por 0,5 s e o traço
  tem pelo menos 20 unidades, ele vira uma linha reta do começo até ali, com espessura uniforme (pressão média);
  leitura "Linha". Depois disso a ponta segue a caneta até soltar. Uma pausa curta (< 0,5 s) não endireita.
  - **Testar no tablet:** riscar e parar 0,5 s antes de soltar; mover a ponta depois de endireitar; desenhar devagar
    sem querer linha (não pode endireitar sozinho com frequência; se acontecer, aumentar o tempo).

### #016 — Exportar vídeo do loop (parte do T-052)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.0
- **Origem:** pedido do Raphael (24/11: "exportação em gif e mov ou mp4 seria top"). Trazido da v0.6.
- **Resposta do VS Code:** Menu → **Exportar vídeo do loop**. Grava o canvas riso em tempo real (MediaRecorder), com
  o loop tocando desde o frame 1 a 1×, por ciclos inteiros (quando todas as tintas desenhadas voltam juntas ao frame
  1), no mínimo 3 s e no máximo 12 s. **MP4 (H.264)** se o Chrome souber gravar, senão WebM. A roda e o traço molhado
  ficam de fora. Ponto vermelho no botão da roda enquanto grava. **GIF não foi feito** (precisa de codificador
  próprio; fica para a v0.6). **MOV não é possível** no navegador.
  - **Testar no tablet:** exportar um loop de 1 s (deve dar um vídeo de 3 s) e ver se é MP4; abrir no Instagram ou na
    galeria; conferir se o grão ferve no vídeo.

### #017 — Mover a seleção: cancelado e toque parado
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.0
- **Origem:** revisão do código pelo VS Code.
- **Resposta do VS Code:** se o sistema cancelava o gesto no meio de um mover (caneta ou 2 dedos), a seleção ficava
  no lugar novo sem passo de desfazer; agora volta ao lugar. Tocar na seleção sem mover não cria mais um passo vazio.

### #018 — Revisão de código da rodada 0.2.0 → 0.3.0
- **Status:** Feito · **Prioridade:** P1 · **Versão alvo:** 0.3.0
- **Origem:** pedido do Raphael ("depois de fazer, faça uma revisão"). Revisão automática (nível alto) do intervalo
  `a91303d..7b9b1b5`, 10 achados.
- **Corrigidos (9):**
  1. Desfazer/abrir arquivo no meio de um giro de 2 dedos → erro e gestos de 2 dedos travados. Agora a transformação
     guarda o frame dela e morre sozinha se o frame for trocado; o gesto sempre é zerado.
  2. Balde ignorava linhas de outras tintas → enchia o frame inteiro. Agora elas são parede.
  3. Balde em cima da linha gravava um passo invisível → agora testa antes (`masks.tryFill`).
  4. Botão 2 como "borracha" (buttons = 32 no contato) não começava o laço → 32 conta como contato.
  5. Vídeo podia sair congelado (hold esquecido, dedo na roda) e com traços desenhados durante a gravação → holds
     zerados, papel e roda bloqueados enquanto grava, sem os 120 ms extras no fim.
  6. Baldes refeitos a cada quadro ao mover a seleção, e abrir arquivo refazia tudo de uma vez → `src/schedule.js`
     (limite de ~8 ms por quadro, balde no máximo a cada 120 ms durante o giro).
  8. "Salvo às…" com mudança pendente (salvamento antigo terminando depois) → contador de mudanças.
  9. Palma no fundo da caixa de confirmação cancelava (e perdia o arquivo escolhido) → só os botões respondem.
  10. PNG com caminho de download próprio e formatação de segundos duplicada → unificados.
- **Não mudado (1):** 7. `willReadFrequently` deixa o canvas das máscaras na CPU para todo traço. Mantido de
  propósito: o balde precisa ler pixels, e o envio CPU → GPU evita a leitura da GPU que a v0.1 acusava ("GPU stall
  due to ReadPixels"). **Medir no tablet** (painel Teste da Fase 0: tempo do quadro ao confirmar traços).
- Teste de lógica: 98 verificações, com uma verificação de mutação para o item 1.

### #019 — Zoom e mover o papel (T-020)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.1
- **Origem:** plano da v0.3 ("pode prosseguir", Raphael, 24/11).
- **Resposta do VS Code:**
  - 2 dedos **fora** da seleção: pinça = zoom (100% a 400%), arrastar = mover o papel. O ponto sob os dedos fica
    sob os dedos. O papel sempre cobre a tela (não dá para afastar além de 100%). Soltar abaixo de 108% encaixa em
    100%. Leitura "200%". Menu → **Encaixar papel (100%)** (só ativo com zoom).
  - O toque rápido de 2 dedos continua desfazendo (só vira zoom depois de 12 px de movimento). 2 dedos sobre a
    seleção (+80 px) continuam girando a seleção (decisão 10).
  - A vista é da sessão (não vai para o `.grao`). Matemática em `src/view.js` (uv da tela; o shader recebe `uView`).
    O traço molhado, o laço, a caixa e os chips da seleção e a prévia de tamanho seguem o zoom. PNG e vídeo sempre
    com o papel inteiro.
  - **Testar no tablet:** pinça para 200–300% e desenhar detalhes; arrastar com 2 dedos; voltar a 100% (encaixa);
    toque rápido de 2 dedos com zoom (desfaz); laçar e girar com zoom; conferir que o traço cai sob a caneta.

### #020 — Pincéis: Lápis, Marcador, Giz (T-021)
- **Status:** Feito · **Prioridade:** P2 · **Versão alvo:** 0.3.1
- **Resposta do VS Code:**
  - Pétala Ferramenta com 7 pastilhas: Pincel, Lápis, Marcador, Giz, Borracha, Balde, Laço. Cada ferramenta tem
    tamanho próprio (`settings.sizes`); o arco de Tamanho mexe na atual (com Balde/Laço, no último pincel).
  - Lápis: metade da largura e tom de 62% na máscara, então o grão do riso falha o traço como grafite (com Grão em
    0 ele fica cheio). Marcador: largura fixa. Giz: carimbos espalhados e falhados, gerados pelo id do traço, iguais
    na tela e na máscara. Borracha sempre no formato do Pincel.
  - O traço guarda o pincel (`b`); Pincel comum não grava nada (arquivo menor). Arquivos antigos abrem iguais.
  - Botão 1 da caneta: alterna a Borracha com o último pincel. Botão da roda: L, M ou G no miolo.
  - **Testar no tablet:** cada pincel com pressão leve e forte; Lápis com Grão alto e baixo; Giz devagar e rápido;
    trocar tamanhos e ver que cada ferramenta lembra o seu.

### #021 — Suavizar traço (T-025)
- **Status:** Feito · **Prioridade:** P3 · **Versão alvo:** 0.3.1
- **Resposta do VS Code:** Menu → **Suavizar traço** (0 a 1, padrão 0 = desligado, decisão 6). Cada ponto anda até
  15% do caminho até a caneta (no máximo); ao soltar, o traço alcança o último ponto real. Vale para todos os
  pincéis (o plano dizia "por pincel"; ficou um ajuste só, mais simples; dá para separar se o chat quiser).
  - **Testar no tablet:** escrever com Suavizar em 0, 0,5 e 1; ver se o atraso incomoda.

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

### D2 — Pedidos do Raphael de 24/11 que estão fora da v0.2 (levar para o chat)
O Raphael pediu, depois de usar a b5: menu de arquivo, paleta riso completa, camadas de verdade, exportar
GIF/MP4/MOV, transformar a seleção, balde, linha, caneta Bézier, opacidade e modos de mistura. Comparação com
`docs/02-decisao-mvp.md` e `docs/10-plano-ate-v1.md` (nada disso foi implementado; só o #008):

| Pedido | No plano? | Onde | Recomendação do VS Code |
| --- | --- | --- | --- |
| Menu de arquivo (novo, salvar, abrir) | Sim | v0.6 T-050 galeria, T-051 arquivo `.grao` | **Antecipar o T-051** (Salvar cópia `.grao` / Abrir `.grao` na folha Mais): é pequeno e protege o desenho, que hoje só vive no navegador. "Novo projeto" já existe. Galeria fica na v0.6. |
| Tintas riso oficiais | Em parte | MVP: 4 tintas; "paletas próprias" = Grão 2 | Valores já corretos (ver `docs/12-tintas-riso.md`, fonte Stencil Wiki; não há hex oficial da Riso). **Raphael (24/11): "não há necessidade de tantas cores"** — manter as 8 atuais; a lista completa fica só como referência, numa folha com grade (só com a caneta parada). Paletas próprias continuam para depois. |
| Camadas confusas | Sim | v0.4 T-030–T-034 | Hoje camada = tinta e a folha "Camadas" só tem tempo (FPS e frames), como a v0.2 pediu. Sugestão barata até a v0.4: **renomear o setor para "Tempo"** (decisão de texto, doc 11). |
| Exportar GIF e MP4 | Sim | MVP essencial; v0.6 T-052 | Manter na v0.6 ou antecipar o GIF. **MOV: não recomendo** (o navegador não grava MOV; MP4 via WebCodecs e WebM funcionam no Chrome). |
| Laço só seleciona? | Sim | MVP | Sim, Laço é só seleção. |
| Girar e escalar a seleção | **Já existe** | decisão 10 | 2 dedos pousados sobre a seleção movem, giram e escalam. Problema real: ninguém descobre. Sugestão: dica no chip ou alças na caixa (decidir no chat). |
| Balde | Sim | v0.3 T-022 | Seguir o plano. |
| Linha reta | Sim | v0.3 T-023 (segurar 0,5 s endireita) | Seguir o plano. |
| Caneta Bézier | **Não** | — | **Não recomendo no Grão**: é ferramenta de precisão vetorial, contra a ideia de caderno e de "um gesto, uma função". Se quiser, avaliar para a Prensa ou Grão 2. |
| Opacidade | Em parte | v0.4 T-030 "retícula" 10–100 % por camada | Seguir o plano: no riso, a "opacidade" é a densidade da retícula da tinta. |
| Modos de mistura | **Não** | decisão 5 (cada camada é uma tinta) | **Não recomendo**: riso é sempre sobreimpressão (multiplicar); outros modos quebram a cara de impressão. |
| Cor de linha e de preenchimento separadas | **Não** | decisão 5 | Cada camada tem uma tinta só; o balde usa a tinta da camada. Duas cores = duas camadas, como na gráfica. |

**O que o chat precisa decidir:** antecipar o T-051 (arquivo) e a grade de tintas para uma v0.2.1? Renomear
"Camadas" para "Tempo" até a v0.4? Como mostrar que 2 dedos giram a seleção?

**Atualização (24/11):** a pedido do Raphael, o VS Code fez o arquivo `.grao` (#010), o nome "Tempo" (#012) e a
dica de 2 dedos (#013). As 8 tintas ficam (decisão do Raphael). Exportar GIF/MP4, Bézier e modos de mistura seguem
como na tabela.

### D3 — Feedback do Raphael no teste da b6 (24/11), para o chat desenhar
- **Cores escondidas:** "as cores ficam escondidas, não fica fácil identificar que tem mais que 4 cores para
  utilizar". Hoje as 8 cores só aparecem no **toque longo** numa tinta da pétala Tinta. Limite a respeitar: no
  máximo **4 tintas por projeto** (limite da riso impressa). Ele **não quer mais cores** (as 8 bastam). Falta
  desenhar como mostrar que a cor de cada uma das 4 tintas pode ser trocada.
- **Menu principal / salvar:** "a falta de um menu principal me incomoda"; não gosta de só ter salvamento
  automático escondido. Pede um menu com Novo, Salvar, Abrir etc. Liga com a recomendação do D2 (antecipar o
  T-051, arquivo `.grao`). Falta decidir: onde fica o menu (setor da roda? folha própria?), quais itens, e se
  entra numa v0.2.1.
- **Resolvida pelo VS Code (24/11), a pedido do Raphael:** #010 (Menu com arquivo `.grao`, no lugar do setor
  "Mais") e #011 (arco das 8 cores sempre visível na pétala Tinta). O chat pode revisar o desenho na auditoria.

## Feitos

_Pedidos concluídos, com a resposta do VS Code._
