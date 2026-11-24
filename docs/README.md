# Documentação do Grão

Leia na ordem se estiver chegando agora. Cada arquivo começa pela conclusão.
Como usar o app: [`INSTRUCOES.txt`](../INSTRUCOES.txt). Estado atual: **1.0.0-rc.1** ([relatório](relatorio-v1.0.md)).

| # | Documento | Resumo |
| --- | --- | --- |
| 01 | [Conceito](01-conceito.md) | Visão, princípios, ferramentas, animação, laço, interface |
| 02 | [Decisão do MVP](02-decisao-mvp.md) | O essencial e a divisão em Grão / Palco / Prensa |
| 03 | [Plataforma-alvo](03-plataforma-alvo.md) | Fatos do tablet XPPen e da caneta, limitações |
| 04 | [Design do sistema v0.1](04-design-sistema-v0.1.md) | Componentes, modelo de dados, metas, falhas |
| 05 | [Motor riso](05-motor-riso.md) | Etapas da simulação, retícula, sobreimpressão, separações, papel |
| 06 | [Referências](06-referencias.md) | Apps parecidos, código aberto útil, licenças, fontes |
| 07 | [Roadmap](07-roadmap.md) | Fases e portões (histórico) |
| 08 | [Testes da Fase 0](08-testes-fase-0.md) | O que medir no tablet antes de construir o resto |
| 09 | [Crítica de design](09-critica-de-design.md) | Problemas de interação, arco narrativo, estratégia |
| 10 | [Plano até a v1.0](10-plano-ate-v1.md) | Fluxo de trabalho, pausas de auditoria, especificação da roda, critérios da 1.0 |
| 11 | [Textos da interface](11-textos-da-interface.md) | Vocabulário, tom, todos os textos do app |
| 12 | [Tintas riso](12-tintas-riso.md) | 81 tintas da Stencil Wiki com hex; o que é oficial e o que é aproximação |
| 13 | [Conselho sobre a v0.3](13-conselho-v0.3.md) | As 5 lentes, gesto de tempo, camadas, retícula, ordem das versões até a 1.0 |
| 14 | [Teste com pessoas](14-teste-com-pessoas.md) | Roteiro do teste com 3 pessoas |
| 15 | [Lista de testes](15-lista-de-testes.md) | Tudo o que testar no tablet na 1.0.0-rc.1 |

## Relatórios de versão (resposta ao HANDOFF)

[v0.2](relatorio-v0.2.md) · [v0.3](relatorio-v0.3.md) · [v0.4](relatorio-v0.4.md) ·
**[0.3.2 → 1.0.0-rc.1](relatorio-v1.0.md)**. Documento completo de cada versão (.docx): [versoes/](versoes/).

## Decisões de arquitetura (ADRs)

| ADR | Título | Status |
| --- | --- | --- |
| [000](adr/ADR-000-template.md) | Modelo para novos ADRs | — |
| [001](adr/ADR-001-plataforma-v0.1.md) | Plataforma do v0.1 (web/PWA) | Proposto (a latência no tablet decide) |
| [002](adr/ADR-002-interface-em-canvas.md) | Interface desenhada em canvas, por baixo do traço | Aceito |
| [003](adr/ADR-003-gestos-de-dois-dedos.md) | Reconhecedor de gestos de 2 dedos (tempo, zoom, transformar, desfazer, palma) | Aceito |
| [004](adr/ADR-004-camadas-tambores-reticula.md) | Camadas separadas das tintas, máscaras por id, retícula no compositor | Aceito |

## Fonte original

O documento vivo, com diagramas, fica no claude.ai: [Conceito do Grão](https://claude.ai/artifact/5uRTqXfiXNv13SzJeMQ1b7)
(abas: Conceito, Pesquisa, ADR-001, Design do sistema v0.1). Quando os dois divergirem, atualize este repositório.
