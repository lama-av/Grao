# CLAUDE.md — contexto do projeto Grão

Leia antes de qualquer mudança. Responda e documente em **português do Brasil**.

## O que é

Grão é um caderno de animação em loop com estética de risografia, para desenhar com caneta no tablet
**XPPen Magic Drawing Pad (MDP1221, Android 15, GPU Mali-G57, tela 60 Hz)**. Projeto pessoal de
Raphael Magalhães (LAMA), designer de animação e motion. Ele domina p5.js/JavaScript e **não** conhece
desenvolvimento Android: explique decisões em linguagem simples e evite jargão sem tradução.

## Estado atual

- Fase 0 / v0.1. Ainda não há código em `src/`.
- Plataforma proposta: web (PWA) no Chrome do tablet — `docs/adr/ADR-001-plataforma-v0.1.md` (status: Proposto).
- Design do sistema: `docs/04-design-sistema-v0.1.md`.
- Escopo do MVP: `docs/02-decisao-mvp.md`. **Não adicione recursos fora dele** sem o Raphael pedir.

## Decisões que não devem ser desfeitas sem conversa

1. **Um gesto, uma função.** Nenhum gesto muda de função conforme um estado escondido.
2. **Nada de 3 dedos nem toque duplo no canvas** (a palma do tablet dispara toques falsos).
3. **A caneta só desenha e faz laço; o tempo fica na zona do polegar**, ao lado do canvas, nunca por cima.
4. **Traços são a fonte; máscaras são cache.** Salve só traços (JSON). Máscaras são refeitas.
5. **Cada camada é uma tinta.** O motor riso não separa cores; tem 5 etapas (ver `docs/05-motor-riso.md`).
6. **Pincéis só com pressão por padrão.** A inclinação deste tablet liga fácil demais.
7. **O loop nunca para.** Salvar, exportar e gerar cache não podem travar a animação.
8. **Modos de mola trazem a pausa junto.** Segurar Laço ou encostar na roda congela o loop; soltar retoma. A roda só anda no tempo; a velocidade fica no fader.
9. **Grão / Palco / Prensa são produtos separados.** MIDI completo, modo ao vivo e impressão (folha, dpi, edições) não entram no Grão v0.1.

## Metas de desempenho (v0.1)

| Meta | Valor |
| --- | --- |
| Latência do traço | sem atraso perceptível; < 50 ms |
| Quadros | 60 fps na interface e no traço |
| Compositor riso | ≤ 8 ms por quadro (senão, meia resolução) |
| Memória de GPU | < 100 MB (4 tintas × 12 frames ≈ 37 MB de máscaras) |

## Stack (v0.1)

- HTML + JavaScript (módulos ES), sem build. p5.js permitido no protótipo.
- Traço molhado: canvas 2D com `desynchronized: true`, por cima de tudo.
- Loop: WebGL2, shaders GLSL ES 3.00 (portáveis para OpenGL ES 3 no Android).
- Salvamento: IndexedDB a cada traço. Offline via service worker.
- Entrada: Pointer Events (`pointerType` separa caneta de dedo; descartar `pointercancel`).

## Licenças — atenção

- Pode usar: riso-colors (MIT), perfect-freehand (MIT), glsl-halftone (MIT/domínio público).
- **Não copiar código** do Diorame (CC BY-NC-SA, não comercial) nem do Pencil2D (GPL). Só estudar e reescrever.
- Toda dependência nova vai para a seção de créditos do `README.md` com a licença.

## Convenções

- Código e nomes em inglês curto; comentários e documentação em português.
- Estrutura em `src/README.md`. Um módulo por responsabilidade (input, doc, clock, render, ui, io).
- Decisão de arquitetura nova → novo ADR em `docs/adr/` (copie `ADR-000-template.md`).
- Toda mudança visível → linha no `CHANGELOG.md`.
- **Documentação de todas as versões:** a cada versão nova (0.1.0, 0.2.0…), gerar `docs/versoes/Grao_Documentacao_vX.Y.Z.docx` com todos os docs atualizados. As versões antigas ficam guardadas na mesma pasta; nunca sobrescrever um .docx de versão anterior.
- Ao terminar uma tarefa, diga ao Raphael **o que testar no tablet**.
