# ADR-004: camadas separadas das tintas, máscaras por id e retícula no compositor

**Status:** Aceito
**Data:** 2026-11-24
**Decide:** Raphael Magalhães (pedidos #028–#031 do chat; implementação pelo VS Code)

**Decisão:** o projeto passa a ter 4 **tintas** (`project.inks`, os tambores) e de 1 a 8 **camadas**. Cada camada imprime
com um tambor, tem o próprio loop e a própria retícula. As máscaras são guardadas pelo **id fixo da camada**.
O compositor junta as camadas por tambor (máximo, não multiplica) e aplica a retícula no shader.

## Contexto

Até a 0.3.x, camada = tinta (4 fixas). A riso de verdade tem 4 tambores e muitas "artes" por tambor; o Raphael pediu
camadas e os dois tipos de retícula (estocástica e reticulada). Restrições: a GPU do tablet (Mali-G57) e a meta de
≤ 8 ms no compositor; o desfazer precisa cobrir as operações de camada; projetos antigos precisam abrir iguais.

## Opções consideradas

### A. Camadas com id fixo, máscaras por id, junção por tambor no shader (escolhida)

| Dimensão | Avaliação |
| --- | --- |
| Complexidade | Média |
| Custo de GPU | 8 texturas + 2 do papel-cebola (10 de 16 unidades); 8 chamadas da função de cobertura por pixel |
| Velocidade de iteração | Boa: um shader, uma passada |

**Prós:** reordenar, esconder, trocar tinta ou desfazer camadas não refaz nenhuma máscara (a textura segue o id);
o mesmo tambor não escurece onde duas camadas se sobrepõem (como na impressão); retícula não é salva nos traços.
**Contras:** 8 camadas custam até 8 leituras de textura e 8 cálculos de cobertura por pixel; medir no tablet.

### B. Juntar as camadas de cada tambor numa máscara por tinta (na CPU) e manter o shader de 4 tintas

**Prós:** shader quase igual ao de antes.
**Contras:** retícula diferente por camada fica impossível; cada traço precisaria refazer a máscara do tambor
inteiro (todas as camadas dele), e loops de tamanhos diferentes no mesmo tambor exigiriam uma máscara por instante.

### C. Uma passada de GPU por camada (framebuffer por tambor)

**Prós:** abre caminho para a sobreimpressão física da v0.7.
**Contras:** até 8 passadas por quadro + 4 framebuffers; mais memória e mais tempo no Mali; complexidade maior agora.

## Análise das trocas

A opção A cabe numa passada e mantém o caminho de portar para OpenGL ES 3 (mesmo `.frag`). A sobreimpressão por
passada (v0.7) pode ser feita depois dentro da mesma função de cobertura, ordenando as tintas.

## Consequências

- **Fica mais fácil:** operações de camada instantâneas; desfazer por retrato (`{type: 'layers', before, after}`).
- **Fica mais difícil:** o arquivo `.grao` tem versão 2 (o `sanitize` migra a versão 1); qualquer código que usava
  `layer.ink` como cor agora usa `inkOf(project, layer)`.
- **A revisitar:** tempo do compositor com 8 camadas reticuladas no tablet; moiré da reticulada com os pixels da tela
  em 100% (a borda do ponto é suavizada por um uniforme `uPxDoc`, sem derivadas).

## Próximos passos

- [ ] Medir no tablet: compositor com 4 e com 8 camadas, estocástica e reticulada (painel Teste da Fase 0).
- [ ] Print da reticulada a 40, 60 e 85 lpi em 100% para checar moiré.
