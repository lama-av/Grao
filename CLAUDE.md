# CLAUDE.md — contexto do projeto Grão

Leia antes de qualquer mudança. Responda e documente em **português do Brasil**, em linguagem simples.

## O que é

Grão é um caderno de animação em loop com estética de risografia, para desenhar com caneta no tablet
**XPPen Magic Drawing Pad (MDP1221, Android 15, GPU Mali-G57 MC2, tela 2160×1440 3:2, 60 Hz)**.
Caneta X3 Pro Slim: 16.384 níveis de pressão, inclinação de 60° (liga fácil demais), hover, 2 botões laterais.
A rejeição de palma é fraca.

Projeto pessoal de Raphael Magalhães (LAMA), designer de animação e motion. Ele domina p5.js/JavaScript
e **não** conhece desenvolvimento Android: explique decisões sem jargão, ou traduza o jargão.

Família de produtos: **Grão** (caderno, este repositório), **Palco** (ao vivo/MIDI), **Prensa** (impressão),
**Motor KV** (motion procedural, separado, conversa por OSC). Só o Grão está em desenvolvimento.

## Estado atual

- **v0.3.1 (24/11/2026):** zoom, pincéis (Lápis, Marcador, Giz), suavização. **v0.3.0:** balde, linha reta, vídeo. **v0.2.1:** Menu com arquivo `.grao`, cores à
  vista, setor Tempo. A v0.2.0 (papel em tela cheia e roda de canto) foi testada pelo Raphael no tablet; a 0.2.1
  e a 0.3.0 ainda não.
  Relatório: `docs/relatorio-v0.2.md`. A Fase 0 completa (`docs/08-testes-fase-0.md`) ainda decide o ADR-001.
- Plataforma: web (PWA) no Chrome do tablet — `docs/adr/ADR-001-plataforma-v0.1.md` (status: **Proposto**).
- Escopo do MVP: `docs/02-decisao-mvp.md`. **Não adicione recursos fora dele** sem o Raphael pedir.
- O que falta e o que mudou: `CHANGELOG.md`.
- Plano até a v1.0, fluxo de trabalho e pausas de auditoria: `docs/10-plano-ate-v1.md`. **A ordem das versões
  agora é a do `docs/13-conselho-v0.3.md`** (0.3.2 gestos → 0.4 camadas e retícula → 0.5 tempo → …).
- Gestos de 2 dedos: `docs/adr/ADR-003-gestos-de-dois-dedos.md` (máquina em `src/input/gestures.js`).
- Vocabulário e textos da interface: `docs/11-textos-da-interface.md`.
- Tintas riso (hex, Pantone, fontes): `docs/12-tintas-riso.md`.
- **Instruções de uso para o Raphael: `INSTRUCOES.txt`** (raiz). Toda mudança visível de comportamento atualiza
  esse arquivo (versão e data no topo), junto com o `CHANGELOG.md`.

## Pedidos de implementação → `HANDOFF.md`

Feedback, UI e UX são decididos na conversa do claude.ai. Lá cada decisão vira um pedido no `HANDOFF.md`.
**No VS Code, comece sempre lendo o `HANDOFF.md`** e implemente a fila conforme as regras dele: não reabra o
design; dúvidas vão para a seção "Dúvidas do VS Code"; ao terminar, preencha a resposta com o que testar no tablet.

## Como rodar

- Sem build e sem npm. Servir a pasta raiz por HTTP (o `fetch` dos shaders não funciona em `file://`).
- VS Code: extensão Live Server → **Go Live** (porta 5500). No tablet: `http://IP-DO-PC:5500`.
- Alternativa: `python -m http.server 8765` na raiz.
- **Teste de lógica (roda nesta máquina, sem navegador):** o VS Code traz um Node dentro.
  Git Bash: `ELECTRON_RUN_AS_NODE=1 "$LOCALAPPDATA/Programs/Microsoft VS Code/Code.exe" tests/logic_test.mjs`.
  Testa caneta, botões da caneta, laço, roda, pétalas, 2 dedos com um DOM de mentira.
  **Rode depois de mudar `input/`, `ui/`, `doc/`, `actions.js` ou `main.js`.** Teste novo de regra → entra nele.
- Checar sintaxe de um módulo: copie para `.mjs` e rode o mesmo `Code.exe --check arquivo.mjs`.
- Teste com navegador e GPU: `python tests/smoke_test.py` (Playwright + Chrome; variável `CHROME`). Não roda
  nesta máquina (sem Playwright); a parte visual é conferida no tablet.
- No console do navegador, `window.grao` é o objeto `app` (para inspecionar).

## Mapa do código

```
index.html, styles.css, manifest.webmanifest, assets/icon.svg
src/
  main.js              cria o objeto app, liga tudo, loop requestAnimationFrame
  view.js              zoom e posição do papel (uv da tela), pinça, encaixe em 100%
  actions.js           ações do app (desfazer, seleção, duplicar, apagar, trocar/novo projeto); usado pelo teste
  schedule.js          quando refazer máscaras: ~8 ms por quadro, dependências do balde entre tintas
  config.js            constantes (documento 1200×800, tintas, papéis, FPS, passo da roda…)
  doc/project.js       projeto, traços, caixas, sanitize (confere cada campo; sempre 4 tintas)
  doc/history.js       desfazer/refazer por frame (listas "antes/depois")
  clock/clock.js       tempo virtual, velocidade, pausa, holds (molas), frame por camada, semente do ferver
  render/stroke.js     traço por pincel (Pincel, Lápis, Marcador, Giz), igual na tela e na máscara
  render/masks.js      traço → textura R8 960×640 por (camada, frame); desenha só os traços novos quando dá
  render/fill.js       balde: preenchimento por varredura dentro da máscara (função pura, testada)
  render/riso/         compositor WebGL2; riso.vert/riso.frag em GLSL ES 3.00
  input/input.js       Pointer Events no canvas: desenhar, recortar, laço, mover, gestos de 2 dedos
  ui/wheel.js          roda de canto no canvas #ui: botão, centro, setores, prato, velocidade, pétalas, chips
  ui/sheet.js          folhas HTML Menu (arquivo e ajustes) e Tempo (FPS e frames) — só com a caneta parada
  ui/dialog.js         caixa de confirmação ("Apagar e começar" / "Cancelar")
  ui/debug.js          painel "Teste da Fase 0"
  io/storage.js        IndexedDB (um projeto atual), salvamento com debounce
  io/file.js           arquivo .grao: salvar (baixar), abrir (seletor do aparelho), conferir (sanitize)
  io/video.js          exportar vídeo do loop (MediaRecorder: MP4 ou WebM), duração por ciclos inteiros
tests/logic_test.mjs  teste de lógica sem navegador (Node do VS Code)
tests/smoke_test.py   teste com Chrome e GPU (Playwright)
```

### Contrato do objeto `app` (criado em `main.js`)

Campos: `project`, `clock`, `history`, `masks`, `riso`, `selection` (`{l, f, ids:Set}` ou `null`),
`lassoHeld`, `tool` (`brush`/`pencil`/`marker`/`chalk`/`eraser`/`bucket`/`lasso`), `lastBrush`, `view`, `recording`, `historyUntil`, `lowLatency`, `debug`, `ui` (roda), `sheet`, `input`.
Funções: `markDirty(l, f)` (refaz a máscara no próximo quadro), `requestSave()`, `undo()`, `redo()`,
`onStrokeCommitted(target)`, `onSelectionChange()`, `duplicateSelectionToNextFrame()`, `deleteSelection()`,
`newProject()`, `replaceProject(p)`, `saveNow()`, `exportPNG()`, `exportVideo()`, `toast(msg)`.
Tipos de traço: `ink` (pincel; `b` = pencil/marker/chalk, sem `b` = Pincel), `cut` (borracha), `fill` (balde: só o
ponto; a área é feita na máscara). Tamanhos por ferramenta em `settings.sizes`; suavização em `settings.smooth`.
Coordenadas da tela → papel sempre por `view.js` (`uvToDoc`), nunca dividindo pela largura direto. `undo()/redo()` devolvem
`true/false` e mostram a leitura na roda. Ações ficam em `src/actions.js` (`installActions(app)`).
Botões da caneta (`input.js`): botão 1 (`buttons & 2`) alterna `tool` entre `brush` e `eraser`; botão 2
(`buttons & 4` ou `& 32`) liga `lassoHeld` e `clock.holds 'lasso'` enquanto apertado.
Entrada: o `#wet` recebe tudo; `app.ui.down(e)` diz se o toque é da roda; senão `app.ui.paperDown()` e segue para o papel.

Regras de fluxo:
- Mudou traços de um frame → `history.push({l, f, before, after})`, `markDirty`, `requestSave`.
- Transformação (mover/girar) só mexe nos clones que ela criou e morre se o frame for trocado (`alive(xf)`).
- Máscaras são refeitas por `schedule.js`, nunca direto no laço: respeite o limite por quadro (decisão 7).
- **Nunca altere um traço no lugar** depois que ele entrou no histórico: troque por `cloneStroke` (ver `beginTransform`).
- Mudou a seleção → chame `app.onSelectionChange()` (ela segura/solta o loop e redesenha o overlay).
- Desfazer pela interface → use `app.undo()/redo()`, não `history` direto.

## Decisões que não devem ser desfeitas sem conversa

1. **Um gesto, uma função.** Nenhum gesto muda de função conforme um estado escondido.
2. **Nada de 3 dedos nem toque duplo no canvas** (a palma dispara toques falsos). Toque de 1 dedo nunca desenha.
3. **O papel é a tela inteira; a interface é uma roda de canto que se recolhe** (a partir da v0.2). A caneta
   desenha e faz laço; o tempo fica na roda, no canto da mão livre. A roda é desenhada no canvas `#ui`, por baixo
   do traço molhado, nunca em DOM por cima dele.
4. **Traços são a fonte; máscaras são cache.** Salve só traços (JSON). Máscaras são refeitas.
5. **4 tintas por projeto (como os tambores da riso); cada camada imprime com uma delas** (a partir da v0.4; até
   então, camada = tinta). Riso é sempre sobreimpressão: nada de modos de mistura. O motor riso tem 5 etapas
   (ver `docs/05-motor-riso.md`).
6. **Pincéis só com pressão por padrão.** A inclinação deste tablet liga fácil demais.
7. **O loop nunca para.** Salvar, exportar e gerar cache não podem travar a animação.
8. **Modos de mola trazem a pausa junto.** Segurar Laço, encostar na roda ou ter uma seleção ativa
   congela o loop (`clock.holds`); soltar retoma. A roda só anda no tempo; a velocidade fica no fader.
9. **Desfazer abre a roda de histórico por 3 s.** Leituras ficam no centro da roda.
10. **Gestos de 2 dedos (ADR-003), decididos uma vez por gesto:** sobre a seleção (caixa + 80 px) = transformar;
    toque rápido = desfazer; pinça = zoom; arrastar com o papel em 100% = tempo (48 px = 1 frame); arrastar com
    zoom = mover o papel. Toques com a caneta perto da tela (até 300 ms) ou largos demais são palma: ignorados
    (menos na roda).
11. **Grão / Palco / Prensa são produtos separados.** MIDI (clock na 1.1), modo ao vivo e impressão não entram no Grão v0.1.
12. **Retícula é por camada:** estocástica (padrão, o grão) ou reticulada (pontos em grade, ângulo por tinta),
    com densidade. É aplicada no compositor; os traços não guardam retícula.

## Metas de desempenho (v0.1)

| Meta | Valor |
| --- | --- |
| Latência do traço | sem atraso perceptível; < 50 ms |
| Quadros | 60 fps na interface e no traço |
| Compositor riso | ≤ 8 ms por quadro (senão, meia resolução) |
| Memória de GPU | < 100 MB (4 tintas × 12 frames ≈ 37 MB de máscaras) |

## Cuidados técnicos

- **No Chrome do Android, canvas `desynchronized: true` não tem transparência** (o vazio fica preto e esconde o
  que está embaixo). Testado no tablet em 23/11. Por isso o traço molhado da v0.1 roda **sem** esse modo (liga
  com `?baixa=1`). Ver dúvida D1 no `HANDOFF.md`. Nada de DOM por cima do traço molhado.
- O traço molhado não é suavizado de propósito (suavizar atrasa).
- `setPointerCapture` passa pela função `capture()`, que ignora falha (ponteiro já sumiu).
- Grão do riso é medido em unidades do documento, não em pixels de tela.
- Cada traço confirmado copia a máscara da CPU para a GPU (`texSubImage2D` de canvas); medir no Mali antes de otimizar.
- Shaders ficam em `.vert/.frag` separados, para portar ao Android (OpenGL ES 3) sem mudança.

## Licenças — atenção

- Pode usar: riso-colors (MIT), perfect-freehand (MIT), glsl-halftone (MIT/domínio público).
- **Não copiar código** do Diorame (CC BY-NC-SA) nem do Pencil2D (GPL). Só estudar e reescrever.
- Toda dependência nova vai para a seção de créditos do `README.md` com a licença.

## Convenções

- Código e nomes em inglês curto; comentários e documentação em português.
- Um módulo por responsabilidade; `render/` não conhece a interface; `ui/` não conhece WebGL.
- Decisão de arquitetura nova → novo ADR em `docs/adr/` (copie `ADR-000-template.md`).
- Toda mudança visível → linha no `CHANGELOG.md`; versão em `src/config.js` (`VERSION`).
- **Documentação de todas as versões:** a cada versão nova (0.2.0…), gerar
  `docs/versoes/Grao_Documentacao_vX.Y.Z.docx` com todos os docs atualizados (pandoc). Nunca sobrescrever
  um .docx de versão anterior.
- Ao terminar uma tarefa, diga ao Raphael **o que testar no tablet**.
