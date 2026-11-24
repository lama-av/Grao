# Grão

Caderno de animação em loop com tinta riso, feito para desenhar com caneta num tablet Android.
Você desenha dentro de um loop que nunca para; o grão da impressão ferve no ritmo da animação.

> **Status:** v0.1.0 — primeira build, em teste no tablet (Fase 0). Plataforma proposta no [ADR-001](docs/adr/ADR-001-plataforma-v0.1.md): app web (PWA) no Chrome do tablet.
> Partes marcadas como *(planejado)* ainda não existem no código.

## Como rodar no tablet

1. Abra a pasta no VS Code e clique em **Go Live** (extensão Live Server).
2. No PC, veja o IP na rede (`ipconfig`, linha IPv4), por exemplo `192.168.0.10`.
3. No tablet, na mesma rede Wi-Fi, abra no Chrome: `http://192.168.0.10:5500`.
4. Menu do Chrome → **Adicionar à tela inicial** para abrir em tela cheia.

O que testar: [testes da Fase 0](docs/08-testes-fase-0.md). Ligue **Ajustes → Teste da Fase 0** para ver pressão, inclinação e quadros por segundo.

## Documentação

Toda a documentação vive em [`docs/`](docs/README.md). Comece por:

| Documento | Para quê |
| --- | --- |
| [Conceito](docs/01-conceito.md) | O que o Grão é, princípios, ferramentas, controles |
| [Decisão do MVP](docs/02-decisao-mvp.md) | O que entra no v0.1, o que fica de fora e a divisão Grão / Palco / Prensa |
| [Plataforma-alvo](docs/03-plataforma-alvo.md) | O tablet XPPen e o que ele permite |
| [Design do sistema v0.1](docs/04-design-sistema-v0.1.md) | Componentes, dados, metas de desempenho |
| [Motor riso](docs/05-motor-riso.md) | Como a risografia é simulada |
| [Referências](docs/06-referencias.md) | Apps parecidos, código aberto útil, licenças, fontes |
| [Roadmap](docs/07-roadmap.md) | Fases e portões |
| [Testes da Fase 0](docs/08-testes-fase-0.md) | O que medir no tablet antes de construir o resto |
| [Decisões (ADRs)](docs/adr/) | Registro das decisões de arquitetura |

O documento original, com diagramas, está no claude.ai: [Conceito do Grão](https://claude.ai/artifact/5uRTqXfiXNv13SzJeMQ1b7). Os arquivos em `docs/` são a versão de referência dentro do projeto.

---

## Começar em 2 minutos (no tablet) *(planejado)*

1. No tablet, abra o link do Grão no **Chrome**.
2. Menu ⋮ → **Adicionar à tela inicial**. O Grão passa a abrir em tela cheia, como um app, e funciona sem internet.
3. Abra pelo ícone. Um loop de 8 frames já está rodando: encoste a caneta e desenhe.

Aparelho-alvo: **XPPen Magic Drawing Pad (MDP1221)**, Android 15, caneta X3 Pro Slim.

## Controles

A caneta só desenha. A outra mão cuida do tempo pela **zona do polegar**, na borda do canvas (do lado direito para canhotos).

| Entrada | Ação |
| --- | --- |
| Caneta | Desenha na tinta ativa |
| Tocar numa tinta | Troca a camada ativa |
| Segurar **Laço** + caneta | Congela o loop e seleciona traços inteiros do frame atual |
| Caneta arrastando dentro da seleção | Move |
| 2 dedos pousados sobre a seleção (ou perto dela) | Giram e escalam |
| Encostar na roda | Segura o disco: congela o loop e mostra o onion skin |
| Girar a roda | Anda no tempo, frame a frame |
| Centro da roda | Toca ou pausa |
| **Fader** ao lado da roda | Velocidade (abaixo do meio toca ao contrário; toque duplo volta a 1×) |
| Tocar em **Desfazer** | Desfaz; por 3 s a roda vira roda de histórico (girar desfaz e refaz) |
| Toque rápido com 2 dedos no canvas | Desfaz |
| Leituras na roda | Frame atual (3/8), velocidade (1,0×), avanço automático |

Nada usa 3 dedos nem toque duplo no canvas: neste tablet, a palma dispara toques falsos.

## Desenvolvimento

Sem build. Detalhes em [`CONTRIBUTING.md`](CONTRIBUTING.md).

1. Abra esta pasta no VS Code e aceite as extensões recomendadas.
2. Clique em **Go Live** (Live Server).
3. No tablet, na mesma rede Wi-Fi, abra `http://IP-DO-COMPUTADOR:5500`.

## Estrutura

```
GRÃO/
├── README.md            você está aqui
├── CLAUDE.md            contexto e regras para sessões com IA (Claude Code)
├── CONTRIBUTING.md      como desenvolver e testar
├── CHANGELOG.md         histórico de versões
├── docs/                conceito, decisões, design, referências
│   └── adr/             registros de decisão de arquitetura
└── src/                 código do app (planejado; ver src/README.md)
```

## Créditos

- Cores das tintas: [riso-colors](https://github.com/mattdesl/riso-colors), de Matt DesLauriers (MIT)
- Contorno do traço com pressão: baseado no algoritmo do [perfect-freehand](https://github.com/steveruizok/perfect-freehand), de Steve Ruiz (MIT)
- Referências de design: Graintouch e Looom (iorama), Diorame, Tagtool, Procreate Dreams, Concepts

## Licença

A definir. Projeto pessoal de Raphael Magalhães (LAMA).
