# 04 · Design do sistema v0.1 (web)

**O v0.1 é uma página web no Chrome do tablet, sem servidor. Dois caminhos de desenho: o traço em andamento vai direto para um canvas de baixa latência por cima de tudo; o loop é composto pela GPU a partir de máscaras por frame.** Segue o [ADR-001](adr/ADR-001-plataforma-v0.1.md).

## Requisitos

**Funcionais**

1. Abrir com um loop de 8 frames rodando e o grão fervendo.
2. Desenhar com a caneta em 4 tintas, com pincel de tinta e borracha de recorte, só com pressão.
3. Cada camada com loop de 1 a 12 frames e FPS próprio.
4. Roda de tempo (prato): encostar congela, girar anda no tempo, centro toca/pausa; fader ao lado controla a velocidade. Segurar Laço também congela.
5. Avanço automático ao levantar a caneta (liga/desliga).
6. Laço segurado: seleciona traços inteiros do frame atual; mover com a caneta, girar e escalar com 2 dedos sobre a seleção.
7. Desfazer com toque de 2 dedos; histórico ao segurar Desfazer e girar a roda.
8. Papel escolhido ao criar o projeto (4 opções).
9. Salvar sozinho; exportar vídeo, GIF, PNG e SVG por tinta.

**Não funcionais**

| Requisito | Meta | Por quê |
| --- | --- | --- |
| Latência do traço | sem atraso perceptível; < 50 ms | Acima disso a coordenação mão-olho piora |
| Quadros | 60 fps na interface e no traço | Tela de 60 Hz (16,7 ms) |
| Compositor | ≤ 8 ms por quadro | Folga para traço, interface e navegador |
| Memória de GPU | < 100 MB | GPU de entrada, RAM compartilhada |
| Perda de trabalho | no máximo o traço em andamento | A aba pode fechar a qualquer momento |
| Offline | sim, depois da primeira abertura | Uso no ateliê ou na rua |

**Restrições:** um desenvolvedor (o autor, com o Claude); um aparelho-alvo; sem servidor nem conta; código legível para quem sabe p5.js.

## Componentes

```
caneta/dedos → ENTRADA ──→ TRAÇO MOLHADO (canvas 2D, por cima) ─────────────┐
                    └──→ DOCUMENTO (traços, desfazer) ──máscaras──→ COMPOSITOR RISO (WebGL2) ──→ TELA
roda de tempo → RELÓGIO (frame de cada camada, velocidade, ferver) ──────────┘
DOCUMENTO → SALVAR E EXPORTAR (IndexedDB, vídeo, GIF, PNG, SVG)
```

| Componente | Responsabilidade | Pasta |
| --- | --- | --- |
| Entrada | Eventos de ponteiro; separa caneta de dedo; descarta toques cancelados (palma); modos segurados | `src/input/` |
| Traço molhado | Desenha o traço em andamento num canvas 2D `desynchronized`, por cima. Nada da página pode ficar sobre ele | `src/render/` |
| Documento | Projeto como dados; pilha de desfazer; ao levantar a caneta, o traço entra aqui e vira máscara | `src/doc/` |
| Relógio | A cada quadro, qual frame de cada camada aparece; velocidade; congelado; semente do "ferver" | `src/clock/` |
| Compositor riso | Junta as máscaras e imprime sobre o papel (ver [05](05-motor-riso.md)) | `src/render/` |
| Interface | Zona do polegar, roda, laço | `src/ui/` |
| Salvar e exportar | IndexedDB a cada traço; arquivos de exportação | `src/io/` |

## Modelo de dados

| Objeto | Campos | Observação |
| --- | --- | --- |
| Projeto | id, nome, papel, tamanho do canvas, 4 tintas, data | Um JSON por projeto |
| Tinta (camada) | cor riso, FPS, frames, deslocamento de fase, opacidade | Cores da lista riso-colors |
| Frame | lista de traços | Máscara gerada, nunca salva |
| Traço | tipo (tinta/recorte), pontos (x, y, pressão, tempo), espessura, transformação (matriz) | O laço só muda a matriz |
| Ação de desfazer | tipo (adicionar, apagar, transformar, frame novo), dados para desfazer/refazer | O histórico na roda anda por esta pilha |

## Por dentro

**Do traço à máscara**
1. Caneta encosta: Entrada cria o traço; Traço molhado começa a desenhar no canvas de cima.
2. O contorno (espessura pela pressão) é calculado na hora, com algoritmo do tipo perfect-freehand (MIT).
3. Caneta levanta: traço vai para o Documento, canvas de cima é limpo, contorno é desenhado na máscara do frame (soma se tinta, subtrai se recorte).
4. Avanço automático ligado → Relógio pula para o próximo frame.

**Máscaras e memória**
- Uma textura de 1 canal por frame por tinta, em meia resolução: 1080 × 720 ≈ 0,78 MB.
- 4 tintas × 12 frames = 48 máscaras ≈ 37 MB.
- Contexto da GPU perdido → máscaras refeitas a partir dos traços.

**Relógio**
- Frame visível = arredondar(tempo × FPS da tinta × velocidade + fase) módulo tamanho do loop.
- Congelado: o tempo para; o anel de dentro muda o frame direto.
- Ferver: semente = número da reimpressão (tempo × reimpressões/s), igual em vídeo e GIF exportados.
- **Fonte de relógio trocável:** na versão 1.1 o clock MIDI vira outra fonte, sem mexer no resto.

**Salvar e exportar**
- IndexedDB logo após cada traço.
- Vídeo: grava o canvas composto (WebM; MP4 se o Chrome suportar).
- GIF e PNG: cada frame em qualidade completa.
- SVG por tinta: contornos dos traços, sem efeito.

**Qualidade adaptativa:** nos primeiros 30 quadros, mede o compositor; se passar de 8 ms, meia resolução e no máximo 12 reimpressões/s. Exportação sempre em qualidade completa.

## Erros e falhas

| Situação | O que acontece |
| --- | --- |
| Palma no canvas | Dedo nunca desenha; toques cancelados são descartados |
| Contexto da GPU perdido | Loop pausa, máscaras refeitas, loop volta |
| Aba fechada | Perde no máximo o traço em andamento |
| Armazenamento cheio | Aviso e oferta de exportar o projeto em arquivo |
| Sem canvas de baixa latência | Funciona com mais atraso; a Fase 0 mede |

## Escala

- Limite do v0.1: 4 tintas × 12 frames. 24 frames ainda cabe (≈ 75 MB), perto da meta.
- Muitos traços só pesam ao refazer máscaras, não no loop.
- Gargalo esperado: o compositor na GPU (por isso a qualidade adaptativa).

## Trocas e o que revisitar

| Decisão | Ganha | Perde | Revisitar quando |
| --- | --- | --- | --- |
| Web em vez de nativo | Iteração rápida, código legível | Latência mínima, botões da caneta | Após o teste de latência da Fase 0 |
| Traços como fonte, máscaras como cache | Laço sem borrar, arquivos leves, SVG por tinta | Refazer máscaras custa CPU | Se refazer ficar lento |
| Máscaras em meia resolução | Memória e velocidade | Nitidez ao vivo | Se o traço parecer borrado ao levantar |
| Canvas do traço separado | Latência menor | Traço molhado sem grão até levantar | Se incomodar, grão leve no traço molhado |
| Sem servidor | Simples, offline, privado | Sem backup na nuvem | Se for para a loja |

**Próximo passo:** construir o caminho do traço (Entrada, Traço molhado, Documento) e medir a latência no tablet antes do compositor.
