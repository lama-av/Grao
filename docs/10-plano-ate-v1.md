# 10 — Plano da v0.1 até a v1.0

Como o Grão sai da primeira build (v0.1.0) e chega a uma v1.0 que dá para usar todo dia: o fluxo de trabalho,
as versões, a lista de tarefas e as pausas para testar, auditar e dar feedback.

## Princípios da interface (valem para todas as versões)

1. **O papel é a tela inteira.** Nada fica fixo do lado da página. A interface é uma **roda de canto** que se
   recolhe num botão pequeno.
2. **Mínimo visível, máximo à mão.** Recolhida, a roda mostra só o essencial: tinta ativa, frame atual e
   tocando/parado. O resto aparece quando você pede e some quando você volta a desenhar.
3. **Um gesto, uma função** (decisão 1 do `CLAUDE.md`). Nenhum botão muda de função por um estado escondido.
4. **A mão da caneta desenha; a outra mão controla o tempo.** A roda fica no canto da mão livre e troca de lado
   no modo Canhoto.
5. **Nada de DOM por cima do traço molhado.** A roda é desenhada num canvas de interface que fica **por baixo**
   do canvas do traço molhado. Assim a caneta continua com baixa latência (ver ADR-002, a escrever na v0.2).
6. **Textos curtos e iguais em todo lugar.** Vocabulário e tom em [11 — Textos da interface](11-textos-da-interface.md).

## Fluxo de trabalho (um ciclo por versão)

```
 ① Testar no tablet ─→ ② Feedback no chat ─→ ③ Design e UX no chat ─→ ④ Pedidos no HANDOFF.md
        ↑                                                                        │
 ⑧ Pausa de auditoria ←─ ⑦ Publicar ←─ ⑥ Teste automático ←─ ⑤ VS Code implementa
```

| Etapa | Onde | Quem | Saída |
| --- | --- | --- | --- |
| ① Testar | Tablet, link do GitHub Pages | Raphael | Anotações, vídeo em câmera lenta, prints |
| ② Feedback | claude.ai (chat) | Raphael + Claude | Lista de problemas com prioridade P1, P2 ou P3 |
| ③ Design | claude.ai (chat) | Claude | Decisão, esboço da roda ou do fluxo, textos |
| ④ Pedidos | `HANDOFF.md` | Claude (chat) | Pedidos numerados com "Pronto quando" |
| ⑤ Implementar | VS Code (Claude Code) | Claude (VS Code) | Código, CHANGELOG, resposta no pedido |
| ⑥ Teste automático | VS Code | Claude (VS Code) | `tests/smoke_test.py` passando |
| ⑦ Publicar | GitHub → Pages | Raphael (ou Claude, se liberado) | Link atualizado |
| ⑧ Auditoria | claude.ai (chat) | Raphael + Claude | Checklist abaixo preenchido; libera ou segura a próxima versão |

**Regras do ciclo**
- Uma versão só começa depois da **pausa de auditoria** da anterior.
- Um problema P1 encontrado no teste vira uma correção (0.x.1) antes de qualquer recurso novo.
- Escopo novo entra neste plano primeiro, não direto no código.
- A cada versão: `VERSION` em `src/config.js`, `CHANGELOG.md` e `docs/versoes/Grao_Documentacao_vX.Y.Z.docx`.

### Checklist da pausa de auditoria ⏸

- **Desempenho no tablet** (painel Teste da Fase 0): quadros/s ≥ 55 desenhando, compositor ≤ 8 ms, baixa
  latência "sim", traço sem atraso visível no vídeo em câmera lenta.
- **Interação:** cada tarefa da versão feita no tablet sem explicação; nenhum toque da palma virou traço;
  nenhum gesto com duas funções.
- **Textos:** conferidos contra o doc 11 (vocabulário, tamanho, tom, mensagens de erro com saída).
- **Dados:** recarregar não perde desenho; desfazer volta exatamente o que mudou.
- **Regressões:** teste automático passando; recursos das versões anteriores ainda funcionam.
- **Documentação:** CHANGELOG, docs atualizados, docx da versão gerado.
- **Decisão:** liberar a próxima versão, ou abrir uma correção 0.x.1.

---

## Versões e tarefas

Legenda: 🧪 teste no tablet · ⏸ pausa de auditoria · 💬 feedback no chat · **T-xxx** = tarefa (vira pedido no HANDOFF).

### v0.1.1 — Fase 0: medir antes de mudar
Objetivo: saber se a versão web aguenta o tablet. Nenhum recurso novo.
- 🧪 T-001 Testes de `docs/08-testes-fase-0.md`: pressão, inclinação, botões da caneta (anotar o valor de
  "botões" para cada botão lateral), palma, quadros/s, vídeo em câmera lenta do traço.
- T-002 Corrigir só problemas P1 encontrados.
- 💬 T-003 Decidir o ADR-001 (web continua ou vai para nativo) com os números.
- ⏸ Auditoria.

### v0.2 — Tela limpa e roda de canto
Objetivo: trocar a zona lateral pela roda de canto, com desfazer e refazer à mão.
> **Fechada em 24/11/2026 (0.2.0).** Sessão de 20 min no tablet: "funcionou tudo certo". T-015 mudou a pedido
> do Raphael: o botão 1 da caneta **alterna** Pincel/Borracha e o botão 2 segura o Laço. Relatório: `relatorio-v0.2.md`.
- T-010 Papel em tela cheia; três canvases empilhados: riso (GPU) → interface (roda) → traço molhado (topo).
- T-011 Roda recolhida: botão de canto com tinta, frame e tocando/parado; mover para outro canto.
- T-012 Roda aberta: centro toca/pausa, anel de setores, prato do tempo, arco de velocidade; recolhe sozinha.
- T-013 Desfazer e Refazer na roda; histórico no prato por 3 s; toque rápido de 2 dedos continua desfazendo.
- T-014 Pétalas de Tinta e de Ferramenta (Pincel, Borracha, Laço, tamanho).
- T-015 Botões da caneta: um segura a Borracha, o outro segura o Laço (pelos valores da Fase 0).
- T-016 Folha "Mais" (ajustes) e chips de seleção (Duplicar, Apagar) perto da caixa selecionada.
- T-017 Textos conforme o doc 11. T-018 Teste automático cobrindo a roda.
- T-019 ADR-002: interface desenhada em canvas por baixo do traço molhado.
- 🧪 Uma sessão de 20 min animando um loop só com a roda. ⏸ Auditoria.

### v0.3 — Papel e ferramentas
Objetivo: navegar pelo desenho e ter ferramentas diferentes, ainda poucas.
- T-020 Zoom e mover o papel com 2 dedos (pinça fora da seleção); "Encaixar papel" na folha Mais; encaixe
  automático em 100 %.
- T-021 Pincéis: **Lápis** (grão, pressão no tamanho), **Marcador** (chapado), **Giz** (falhado, textura).
  Cada um com tamanho próprio.
- T-022 **Balde**: preenche uma área fechada do frame com a tinta da camada.
- T-023 **Linha reta**: segurar a caneta parada 0,5 s no fim do traço endireita a linha.
- T-024 Tamanho rápido: arco de tamanho na pétala de Ferramenta, com prévia do círculo.
- T-025 Suavização opcional por pincel (padrão desligado; decisão 6).
- 🧪 Ilustração parada + loop curto com as ferramentas novas. ⏸ Auditoria.

### v0.4 — Camadas
Objetivo: separar **tinta** (cor riso) de **camada** (folha de desenho).
- T-030 Até 8 camadas; cada camada tem uma tinta, visibilidade, trava e **retícula** (densidade 10–100 %, o
  "tom" do riso).
- T-031 Pétala Camadas: lista vertical curta, arrastar para reordenar, toque para ativar.
- T-032 FPS e número de frames por camada (loops de tamanhos diferentes, polimetria).
- T-033 Desfazer cobre operações de camada (criar, apagar, reordenar, mudar tinta).
- T-034 Migração: projetos da v0.3 abrem com as 4 camadas antigas.
- 🧪 Animação com 3 camadas em loops diferentes. ⏸ Auditoria.

### v0.5 — Tempo e animação
Objetivo: editar a animação sem sair do papel.
- T-040 Tira de frames no prato: inserir, duplicar, apagar e mover frame.
- T-041 Exposição: segurar um frame por 2 ou 3 tempos.
- T-042 Copiar e colar seleção entre frames e camadas.
- T-043 Papel-cebola configurável (quantos frames antes e depois, opacidade).
- T-044 Auto melhorado: avançar ou voltar; parar no último frame.
- 🧪 Ciclo de caminhada de 12 frames. ⏸ Auditoria.

### v0.6 — Projetos e exportação
Objetivo: não perder nada e tirar a animação do app.
- T-050 Galeria de projetos (criar, duplicar, renomear, apagar com confirmação).
- T-051 Arquivo `.grao` para backup e importação.
- T-052 Exportar GIF, MP4 (ou WebM) e sequência de PNG; escolher escala e número de voltas do loop.
- T-053 Service worker: abre sem internet.
- 🧪 Exportar e postar um loop. ⏸ Auditoria.

### v0.7 — Riso completo
Objetivo: o visual que vende o app.
- T-060 Sobreimpressão física: uma passada por tinta, na ordem de impressão.
- T-061 Desalinhamento por tinta (direção e força); travar o desalinhamento.
- T-062 Retícula visível (pontos ou linhas) por camada.
- T-063 Papéis novos e "Prova de impressão" (prévia parada em alta resolução).
- 🧪 Comparar com uma impressão riso de verdade, se houver acesso. ⏸ Auditoria.

### v0.8 — Primeira vez e textos
Objetivo: alguém que nunca viu o Grão consegue animar em 2 minutos.
- T-070 Projeto de boas-vindas com 3 dicas no próprio papel (sem tutorial em tela cheia).
- T-071 Estados vazios, erros e confirmações revisados pelo doc 11.
- T-072 Revisão de acessibilidade: contraste, tamanho mínimo de toque (48 px), rótulos para leitor de tela.
- 🧪 Teste com 3 pessoas de fora (colegas da ESPM). 💬 Feedback. ⏸ Auditoria.

### v0.9 — Beta
Objetivo: estabilidade.
- T-080 Sessão de 1 hora sem travar nem perder desenho.
- T-081 Desempenho: meia resolução automática do compositor se passar de 8 ms.
- T-082 Correções do beta. Congelar recursos.
- ⏸ Auditoria de lançamento.

### v1.0 — Lançamento
Critérios para chamar de v1.0:
- Todas as metas de desempenho do `CLAUDE.md` cumpridas no tablet.
- Nenhum bug P1 ou P2 aberto.
- Documentação e docx da v1.0; créditos e licenças conferidos.
- Decidido onde publicar: link web (PWA) e, se fizer sentido, Play Store.

### Depois da v1.0 (fora deste plano)
- 1.1: clock MIDI de entrada (decisão já tomada no conceito).
- Palco (ao vivo/MIDI), Prensa (impressão) e Motor KV são produtos separados.

---

## A roda de canto (especificação para a v0.2)

```
 Recolhida (64 px)                Aberta (240 px de diâmetro, encaixada no canto)

   ╭───╮                          arco de velocidade ─╮
   │ ● │  ← tinta ativa               ╭──────────────╮
   ╰───╯  anel de pontos = frames    ╱  · · prato · ·  ╲   ← anel externo: prato do tempo
                                    │  ╱ Des │ Ref ╲   │      (girar = frame; encostar = segura)
                                    │ │ Tin ( ▶ ) Fer │  │   ← anel do meio: 6 setores
                                    │  ╲ Cam │ Mais ╱  │   ← centro: tocar/pausar
                                     ╲  · · · · · ·   ╱
                                      ╰──────────────╯
```

**Recolhida**
- Círculo de 64 px a 16 px do canto inferior da mão livre (esquerdo para destro, direito no modo Canhoto).
- Mostra a cor da tinta ativa, um anel de pontos com o frame atual aceso e um traço fino quando está parado.
- **Toque:** abre a roda. **Segurar 0,4 s e arrastar:** leva o botão para outro canto (encaixa nos 4 cantos).

**Aberta**
- Centro (raio 36 px): toque = tocar/pausar.
- Anel do meio (raio 36–80 px), 6 setores: **Desfazer, Refazer, Tinta, Ferramenta, Camadas, Mais**.
  Na v0.2, Camadas abre só FPS e frames da camada ativa; vira o painel completo na v0.4.
- Anel externo (raio 80–120 px): **prato do tempo**. Encostar segura o loop; 30° = 1 frame. Os pontos dos
  frames ficam nesse anel.
- Arco de velocidade (fora do prato, 60°): −2× a 2×, encaixa em 1×; toque duplo volta a 1×.
- Leitura passageira no centro por 1,5 s ao mudar algo: "3/8", "1,5×", "Desfeito".
- **Recolhe** quando a caneta começa a desenhar ou o dedo toca o papel, a menos que esteja **fixada**
  (alfinete na folha Mais). Recolher nunca muda o estado do tempo.

**Pétalas** (submenus em arco, fora da roda; somem ao escolher ou ao tocar fora)
- Tinta: as tintas da camada ativa; toque longo numa tinta troca a cor dela.
- Ferramenta: Pincel, Borracha, Laço, mais o arco de tamanho com prévia.
- Mais: folha compacta com Grão, Desalinhamento, Ferver, Papel, Exportar PNG, Novo projeto, Canhoto, Fixar
  roda, Teste da Fase 0.

**Seleção:** dois chips ao lado da caixa selecionada: "Duplicar →" e "Apagar". Tocar fora da seleção solta.

**Camadas técnicas:** `#gl` (riso) → `#ui` (roda, chips e caixa da seleção, canvas 2D comum) → `#wet` (traço
molhado, `desynchronized`, recebe todos os eventos e repassa para a roda quando o toque cai na área dela).
