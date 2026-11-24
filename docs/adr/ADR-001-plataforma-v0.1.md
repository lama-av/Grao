# ADR-001: plataforma do v0.1

**Status:** Proposto
**Data:** 2026-11-23
**Decide:** Raphael Magalhães

**Decisão proposta:** o v0.1 é um app web instalável (PWA) no Chrome do tablet, em JavaScript, com o traço num canvas de baixa latência e o motor riso em WebGL2. p5.js pode ser usado no protótipo. Kotlin nativo só entra se a latência do traço reprovar na Fase 0.

## Contexto

- Um aparelho-alvo: XPPen Magic Drawing Pad (Android 15, Mali-G57, 60 Hz, caneta EMR 16.384 níveis). Ver [03](../03-plataforma-alvo.md).
- O autor domina p5.js e JavaScript, não conhece Android e trabalha sozinho, com o Claude.
- O v0.1 precisa testar rápido a interação (roda, laço, palma) e o visual (grão), mudando várias vezes por dia.
- Risco técnico nº 1: latência do traço. A Ink API nativa promete o mínimo; no Chrome, o canvas `desynchronized` pula a atualização normal da página.
- No Chrome Android: pressão e inclinação nos Pointer Events, caneta separada do dedo, Web MIDI desde 2015.

## Opções consideradas

### A. Web (PWA) com p5.js e WebGL2

| Dimensão | Avaliação |
| --- | --- |
| Complexidade | Baixa |
| Custo | Zero |
| Velocidade de iteração | Muito alta |
| Familiaridade do autor | Alta |
| Latência | Média; a medir |

**Prós:** teste por link; autor entende o código; shaders GLSL ES 3.00 reaproveitáveis no Android (OpenGL ES 3); empacotável como APK depois (Capacitor).
**Contras:** latência pior que a nativa; p5.js cria o próprio canvas (o canvas do traço pode precisar ser montado à mão); botões da caneta podem não chegar.

### B. Kotlin nativo com a Ink API

| Dimensão | Avaliação |
| --- | --- |
| Complexidade | Alta |
| Custo | Android Studio + configurar o tablet |
| Velocidade de iteração | Média |
| Familiaridade do autor | Nenhuma |
| Latência | A melhor possível |

**Prós:** latência mínima; laço e borracha prontos na Ink API; acesso total a caneta, MIDI e HDMI.
**Contras:** curva alta; cada ajuste custa mais; dependência total do Claude.

### C. Web empacotada (Capacitor) desde o início

| Dimensão | Avaliação |
| --- | --- |
| Complexidade | Média |
| Velocidade de iteração | Média |
| Latência | Igual à A |

**Prós:** APK pronto para loja. **Contras:** complexidade de build sem ganhar latência.

## Análise das trocas

O v0.1 precisa provar interação e visual, não a latência final — isso favorece a web. A latência vira teste explícito da Fase 0 ([08](../08-testes-fase-0.md)): se o traço parecer colado à caneta, a web continua; se não, o núcleo do traço vai para Kotlin, levando o que já foi validado. C só na hora de publicar.

## Consequências

- **Mais fácil:** testar por link; ajustar a interação várias vezes por dia; o autor ler e mexer no código.
- **Mais difícil:** latência mínima; botões da caneta; HDMI em segunda tela.
- **A revisitar:** após o teste de latência da Fase 0; antes de publicar.

## Próximos passos

- [ ] Montar o v0.1 web começando pelo caminho do traço
- [ ] Rodar os testes da Fase 0 no tablet
- [ ] Atualizar este ADR para **Aceito** ou **Substituído**
