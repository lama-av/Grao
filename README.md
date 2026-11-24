# Grão

**Caderno de animação em loop com cara de impressão risográfica**, feito para desenhar com caneta num tablet
Android. Você desenha dentro de um loop que nunca para; o grão da impressão ferve no ritmo da animação.

> **Versão:** `1.0.0-rc.1`, candidata a 1.0 (24/11/2026). Todos os recursos do plano até a 1.0 estão no app;
> **falta o teste no tablet** para virar 1.0.0. Relatório: [docs/relatorio-v1.0.md](docs/relatorio-v1.0.md) ·
> Lista de testes: [docs/15-lista-de-testes.md](docs/15-lista-de-testes.md).

## Abrir

| | Link |
| --- | --- |
| **App** (Chrome do tablet; "Adicionar à tela inicial" para instalar e usar sem internet) | https://lama-av.github.io/Grao/ |
| **Como usar** | [INSTRUCOES.txt](INSTRUCOES.txt) |
| Lista de testes no tablet | [docs/15-lista-de-testes.md](docs/15-lista-de-testes.md) |
| Teste da caneta (Fase 0: botões, palma, latência) | https://lama-av.github.io/Grao/teste-caneta.html |
| Diagnóstico do WebGL | https://lama-av.github.io/Grao/diag.html |

Aparelho-alvo: **XPPen Magic Drawing Pad (MDP1221)**, Android 15, caneta X3 Pro Slim.

## O que dá para fazer

- **Desenhar no loop:** Pincel, Lápis, Marcador, Giz, Borracha, Balde (respeita linhas de outras camadas), Laço,
  linha reta, suavização opcional, zoom até 400%.
- **Tempo na mão livre:** roda de canto com prato (gira no tempo), velocidade, desfazer/refazer; arrastar 2 dedos
  anda no tempo; tira de frames com miniaturas, exposição, inserir/duplicar/mover frame, papel-cebola.
- **Riso de verdade:** 4 tintas (tambores) entre 9 cores riso, até 8 camadas, retícula estocástica ou reticulada
  (ponto redondo, linha, elipse), sobreimpressão na ordem de impressão, desalinhamento até 3 mm, trapping, papéis,
  grão que ferve, Prova de impressão.
- **Guardar e levar:** galeria de projetos no aparelho, arquivo `.grao`, exportar GIF, vídeo (MP4/WebM), PNGs e
  **separações por tinta a 300 dpi para a gráfica riso**.
- **Pensado para o tablet:** a palma não vira gesto; nada de 3 dedos nem toque duplo; roda com alvos de 48 px;
  abre sem internet; qualidade automática se o tablet engasgar.

## Para quem desenvolve

Sem build e sem npm. JavaScript em módulos, WebGL2 (GLSL ES 3.00), IndexedDB, service worker.

1. Abra a pasta no VS Code → **Go Live** (Live Server, porta 5500). No tablet: `http://IP-DO-PC:5500`.
2. Teste de lógica (sem navegador, com o Node que vem no VS Code):
   `ELECTRON_RUN_AS_NODE=1 "$LOCALAPPDATA/Programs/Microsoft VS Code/Code.exe" tests/logic_test.mjs`
3. Regras do projeto, mapa do código e decisões: [CLAUDE.md](CLAUDE.md). Pedidos: [HANDOFF.md](HANDOFF.md).
4. A cada publicação: `BUILD` em `src/config.js` e `VERSION` em `sw.js` (o teste confere).

```
index.html, styles.css, sw.js, manifest.webmanifest
src/        main.js, actions.js, schedule.js, view.js, quality.js, config.js
            doc/ (projeto, desfazer, boas-vindas)  input/ (caneta, gestos)  render/ (riso, máscaras, balde)
            ui/ (roda, folhas)  io/ (salvar, arquivo, vídeo, GIF, ZIP)  clock/
docs/       conceito, decisões, motor riso, textos, testes, relatórios, ADRs, docx de cada versão
tests/      logic_test.mjs (265 verificações), smoke_test.py (Playwright, desatualizado)
tools/      gerar_docx.py (documentação de cada versão, com pandoc)
```

## Documentação

Índice completo em [docs/README.md](docs/README.md). Para começar: [Conceito](docs/01-conceito.md) ·
[Motor riso](docs/05-motor-riso.md) · [Textos da interface](docs/11-textos-da-interface.md) ·
[Roteiro até a 1.0](docs/13-conselho-v0.3.md) · [Histórico de versões](CHANGELOG.md).

Família de produtos: **Grão** (este caderno) · Palco (ao vivo/MIDI) · Prensa (impressão) · Motor KV. Só o Grão está
em desenvolvimento.

## Créditos

- Cores das tintas: valores da [Stencil Wiki](https://stencil.wiki/wiki/Category:Riso_inks) e do pacote
  [riso-colors](https://github.com/mattdesl/riso-colors), de Matt DesLauriers (MIT). As cores são da Riso Kagaku;
  hex é aproximação para tela.
- Referências técnicas de riso: [Secret Riso Club](https://secretrisoclub.com/Riso-Basics) e
  [Risotrip](https://risotrip.co/Impressao) (densidade, desalinhamento, trapping, separações).
- Referências de design: Graintouch e Looom (iorama), Diorame (só estudado, CC BY-NC-SA), Tagtool, Procreate Dreams.
- Todo o código é próprio; não há biblioteca de terceiros no app. Codificadores de GIF e ZIP escritos para o Grão.
- Ferramenta de documentação (fora do app): [pandoc](https://pandoc.org).

## Licença

A definir. Projeto pessoal de Raphael Magalhães (LAMA).
