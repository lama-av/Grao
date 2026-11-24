# Relatório da v0.4.0: camadas, retícula e uso sem internet

**Para:** o Claude do chat (auditoria) e o Raphael · **De:** o Claude do VS Code · **Data:** 24/11/2026
**Build:** `0.4.0-b12` · **Pedidos:** #028–#033, #035, #032 (respostas no `HANDOFF.md`) · **Arquitetura:** ADR-004

> Feita sem a pausa de auditoria da 0.3.2, a pedido do Raphael ("execute os pedidos até a versão 1.0, sem pausas").

## O que mudou

- 4 tintas (tambores) + até 8 camadas; cada camada com tinta, loop, visível, travada e retícula.
- Pétala **Camadas** no lugar de Tinta; toque longo numa camada abre a folha da camada.
- Retícula **Estocástica** ou **Reticulada** (ângulo por tinta), densidade de 5% a 100%, lineatura 40/60/85.
- Desalinhamento calibrado (até 3 mm num A4), trapping do balde, Tintas prontas (Falso CMYK).
- Abrir sem internet (`sw.js`), com aviso de versão nova no botão da roda.
- Arquivo `.grao` versão 2 com migração automática da versão 1.

## Diferenças em relação aos pedidos

| Pedido | Diferença | Por quê |
| --- | --- | --- |
| #028 | Apagar a última camada é bloqueado (texto novo "A última camada não pode ser apagada.") | Projeto sem camada não faz sentido; o pedido não dizia |
| #029 | O arco das 9 cores continua na pétala Camadas (troca a cor da tinta da camada ativa) | Mantém as cores à vista (queixa da D3) |
| #030 | Borda do ponto suavizada por uniforme, não por `fwidth` | Derivadas dentro de desvios são indefinidas no GLSL ES; o Mali pode errar |
| #030 | Estocástica: a densidade remove "cachos" de tinta (ruído de ~1 unidade), não pontos isolados | Mantém a cara do grão atual a 100% e fica orgânico nos tons baixos |
| #035 | A lista de arquivos do `sw.js` é escrita à mão (sem build), conferida pelo teste | "Sem build e sem npm" (CLAUDE.md) |

## Riscos que só o tablet mostra

1. **Shader não compilado aqui** (validador bloqueado). Se o app abrir com "Shader: …" na caixa vermelha, mande print.
2. **Tempo do compositor** com 8 camadas reticuladas (meta ≤ 8 ms).
3. **Moiré** da reticulada com os pixels da tela em 100%.

## Roteiro de teste no tablet

| # | Teste | Resultado |
| --- | --- | --- |
| 1 | Abrir um projeto salvo na 0.3.x: aparece igual (4 camadas, mesmas cores) | |
| 2 | Pétala Camadas: criar até 8 camadas com "+", ativar, desenhar em várias | |
| 3 | Toque longo numa camada: trocar tinta e cor, Visível, Travar (tentar desenhar: "Camada travada"), Subir, Descer, Duplicar, Apagar | |
| 4 | Desfazer cada operação de camada | |
| 5 | Retícula Reticulada em duas camadas de tintas diferentes: ângulos diferentes; densidade 100%, 30%, 10%, 5% | |
| 6 | Lineatura 40 / 60 / 85 (Menu → Impressão); moiré em 100%? (print) | |
| 7 | Desalinhamento no máximo + linha preta e balde rosa: sem filete branco; desligar Trapping: filete aparece | |
| 8 | Falso CMYK e "Do projeto" | |
| 9 | Duas camadas com loops diferentes (Tempo): tocam juntas; gesto de tempo anda na ativa; "C2 · 3/8" com 5+ camadas | |
| 10 | Painel Teste da Fase 0: compositor com 4 camadas ___ ms, com 8 camadas reticuladas ___ ms; quadros/s ___ | |
| 11 | Instalar (Adicionar à tela inicial), desligar o Wi-Fi, abrir e desenhar | |
| 12 | Depois de uma publicação nova: com o loop parado aparece "Nova versão. Toque para atualizar."; tocar não perde o desenho | |
