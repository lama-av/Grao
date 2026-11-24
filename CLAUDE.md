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

- **v0.1.0 construída** (primeira build web/PWA). Ainda **não testada no tablet**: os resultados da Fase 0
  (`docs/08-testes-fase-0.md`) vão decidir o ADR-001.
- Plataforma: web (PWA) no Chrome do tablet — `docs/adr/ADR-001-plataforma-v0.1.md` (status: **Proposto**).
- Escopo do MVP: `docs/02-decisao-mvp.md`. **Não adicione recursos fora dele** sem o Raphael pedir.
- O que falta e o que mudou: `CHANGELOG.md`.
- Plano até a v1.0, fluxo de trabalho e pausas de auditoria: `docs/10-plano-ate-v1.md`.
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
- Teste automático: `python tests/smoke_test.py` (Playwright + Chrome; ajuste `executable_path`).
  Ele simula caneta, toque, laço, mover, duplicar, desfazer com 2 dedos, roda e recarregar.
  Rode depois de mudar `input/`, `ui/`, `doc/` ou `main.js`.
- No console do navegador, `window.grao` é o objeto `app` (para inspecionar).

## Mapa do código

```
index.html, styles.css, manifest.webmanifest, assets/icon.svg
src/
  main.js              cria o objeto app, liga tudo, loop requestAnimationFrame
  config.js            constantes (documento 1200×800, tintas, papéis, FPS, passo da roda…)
  doc/project.js       projeto, traços, caixas, sanitize de arquivos carregados
  doc/history.js       desfazer/refazer por frame (listas "antes/depois")
  clock/clock.js       tempo virtual, velocidade, pausa, holds (molas), frame por camada, semente do ferver
  render/stroke.js     desenho do traço com pressão (igual na tela e na máscara)
  render/masks.js      traço → textura R8 960×640 por (camada, frame)
  render/riso/         compositor WebGL2; riso.vert/riso.frag em GLSL ES 3.00
  input/input.js       Pointer Events no canvas: desenhar, recortar, laço, mover, gestos de 2 dedos
  ui/wheel.js          roda de canto no canvas #ui: botão, centro, setores, prato, velocidade, pétalas, chips
  ui/sheet.js          folhas HTML Mais e Camadas (só com a caneta parada)
  ui/debug.js          painel "Teste da Fase 0"
  io/storage.js        IndexedDB (um projeto atual), salvamento com debounce
tests/smoke_test.py
```

### Contrato do objeto `app` (criado em `main.js`)

Campos: `project`, `clock`, `history`, `masks`, `riso`, `selection` (`{l, f, ids:Set}` ou `null`),
`lassoHeld`, `tool` (`brush`/`eraser`/`lasso`), `historyUntil`, `lowLatency`, `debug`, `ui` (roda), `sheet`, `input`.
Funções: `markDirty(l, f)` (refaz a máscara no próximo quadro), `requestSave()`, `undo()`, `redo()`,
`onStrokeCommitted(target)`, `onSelectionChange()`, `duplicateSelectionToNextFrame()`, `deleteSelection()`,
`newProject()`, `exportPNG()`, `toast(msg)`. `undo()/redo()` devolvem `true/false` e mostram a leitura na roda.
Entrada: o `#wet` recebe tudo; `app.ui.down(e)` diz se o toque é da roda; senão `app.ui.paperDown()` e segue para o papel.

Regras de fluxo:
- Mudou traços de um frame → `history.push({l, f, before, after})`, `markDirty`, `requestSave`.
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
5. **Cada camada é uma tinta.** O motor riso tem 5 etapas (ver `docs/05-motor-riso.md`); o v0.1 faz uma passada só.
6. **Pincéis só com pressão por padrão.** A inclinação deste tablet liga fácil demais.
7. **O loop nunca para.** Salvar, exportar e gerar cache não podem travar a animação.
8. **Modos de mola trazem a pausa junto.** Segurar Laço, encostar na roda ou ter uma seleção ativa
   congela o loop (`clock.holds`); soltar retoma. A roda só anda no tempo; a velocidade fica no fader.
9. **Desfazer abre a roda de histórico por 3 s.** Leituras ficam no centro da roda.
10. **2 dedos transformam a seleção só se pousarem sobre ela** (caixa + 80 px de folga); toque rápido de 2 dedos = desfazer.
11. **Grão / Palco / Prensa são produtos separados.** MIDI (clock na 1.1), modo ao vivo e impressão não entram no Grão v0.1.

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
