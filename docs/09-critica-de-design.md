# 09 · Crítica de design: interação e estratégia

**Veredito: o conceito é forte e tem um diferencial real, mas a interação ainda tem três falhas graves, todas no mesmo lugar: o polegar da mão que não desenha tem trabalho demais, e alguns estados do app são invisíveis.**
As três: (1) o laço funciona sobre um frame que continua andando; (2) várias ações exigem que o mesmo polegar faça duas coisas ao mesmo tempo; (3) os anéis da roda são alvos pequenos demais para o polegar e misturam posição no tempo com velocidade.

Avaliação feita sobre o conceito e o layout revisado (fidelidade de wireframe), em 23/11/2026. Base: heurísticas de Nielsen, Leis de UX, microinterações (Saffer), postura e excise (Cooper), arco narrativo e regra do pico e fim (Lichaw, Kahneman), JTBD, Opportunity Solution Tree e HEART.

## Contexto da avaliação

- **Quem:** o próprio autor (designer de animação e motion), destro, desenhando com o tablet apoiado numa mesa ou no colo.
- **Tarefa principal:** transformar uma ideia visual num loop curto com cara de impresso.
- **Momento:** uso diário, sessões de 10 a 60 minutos.
- **Postura do produto:** soberana (atenção total, sessões longas). Isso pede controles densos e rápidos para quem já sabe usar, e não telas de ajuda.
- **Restrições:** tablet de 60 Hz, palma pouco confiável, 2 dedos no máximo, um desenvolvedor.

## Problemas, do mais grave ao menos grave

| # | Problema | Princípio violado | Severidade | Recomendação |
| --- | --- | --- | --- | --- |
| 1 | **O laço funciona num frame que se move.** Com o loop tocando, o desenho muda sob a caneta enquanto você fecha o laço. | Controle e liberdade (H3); prevenção de erros (H5) | 4 · catástrofe | Segurar a tecla de laço **congela o loop automaticamente**; soltar retoma. O laço passa a ser um modo de mola que já traz a pausa junto. |
| 2 | **Um polegar, duas tarefas.** "Segurar Desfazer e girar a roda" e "segurar uma tinta e girar a borda" pedem dois pontos de contato na mesma zona; o polegar também segura laço e congela a roda. | Lei de Fitts; carga física (excise) | 3 · grave | Separar por dedo e por lugar: polegar só na roda; indicador nas teclas. Ou modo de uma vez só: tocar em Desfazer transforma a roda em **roda de histórico por 3 s**, com a mudança visível na própria roda. |
| 3 | **Anel de dentro e borda de fora num disco de ~3 cm.** Acertar o anel certo com o polegar sem olhar é difícil, e errar troca posição no tempo por velocidade. | Fitts; um gesto, uma função (H4); modelo mental | 3 · grave | Seguir o toca-discos real: **prato = tempo, pitch fader = velocidade**. A roda só anda no tempo; a velocidade vai para um fader vertical ao lado dela. Testar as duas versões na Fase 0. |
| 4 | **"Polegar parado congela" depende de um tempo invisível.** Quando o polegar encosta para girar, primeiro ele está parado; o app precisaria adivinhar a intenção. | Visibilidade do status (H1); regras previsíveis | 3 · grave | Regra simples e física: **encostar na roda = segurar o disco (congela)**; girar = anda no tempo; soltar = volta a tocar. Sem temporizador. |
| 5 | **Estados que não aparecem:** qual frame, tocando ou congelado, velocidade, avanço automático ligado ou não, camada ativa. | Visibilidade do status (H1); reconhecer em vez de lembrar (H6) | 3 · grave | Leituras discretas na própria roda: número do frame (3/8), velocidade (1,0×), um ponto de "auto". Usuários do Graintouch pediram exatamente valores numéricos. |
| 6 | **Toque com 2 dedos para desfazer na mesma área do pinça e arrasto.** Dois dedos que pousam para mover o canvas podem virar um toque e desfazer sem querer; a palma piora. | Prevenção de erros (H5) | 2 · menor | Exigir toque curto (< 200 ms) e quase parado para desfazer; mostrar o que foi desfeito com um aviso breve. A tecla Desfazer continua sendo o caminho principal. |
| 7 | **"2 dedos sobre a seleção" com seleções pequenas.** Uma pose de 1 cm não cabe dois dedos. | Fitts | 2 · menor | Área de toque = caixa da seleção + 2 cm de margem. Fora disso, mexe no canvas. |
| 8 | **O traço muda de visual ao levantar a caneta** (sem grão enquanto desenha, com grão depois). Pode parecer um "pulo". | Consistência (H4); verdade do material | 2 · menor | Testar com um grão leve no traço molhado. Se o pulo não incomodar, manter: é mais barato. |
| 9 | **Tela vazia não mostra que o loop está vivo.** Com o canvas em branco, 8 frames vazios parecem uma tela parada. | Evitar telas em branco; arco narrativo | 2 · menor | Na abertura, o papel ferve e os pontos de frame avançam; no primeiro projeto, o avanço automático já vem **ligado**, para que 8 traços virem uma animação. |
| 10 | **Tintas identificadas só pela cor.** | Acessibilidade | 1 · cosmético | Nome curto da tinta ao segurar (ex.: "Rosa flúor") e um padrão mínimo de diferença de luminosidade entre tintas da mesma paleta. |
| 11 | **Grão fervendo sem parar pode cansar.** | Movimento reduzido | 1 · cosmético | "Ferver" já pode desligar; respeitar a preferência de movimento reduzido do sistema. |

## Microinterações principais redesenhadas

| Microinteração | Gatilho | Regras | Feedback | Modo |
| --- | --- | --- | --- | --- |
| Segurar o disco | Polegar encosta na roda | Congela o loop; onion skin aparece | Roda escurece levemente; onion surge em 100 ms | Mola (só enquanto encosta) |
| Girar no tempo | Polegar gira o prato | 1 frame a cada ~30° | Pontos de frame acendem; número 3/8 | — |
| Velocidade | Polegar ou indicador no fader | 0× a 2×; abaixo do centro, ao contrário; toque duplo volta a 1× | Valor 1,0× no topo do fader | — |
| Laço | Indicador segura a tecla | Congela o loop; caneta faz laço; ao soltar, retoma | Tecla acesa; contorno tracejado da seleção | Mola, já com a pausa |
| Histórico | Toque em Desfazer | Roda vira histórico por 3 s; girar desfaz e refaz | Roda muda de cor e mostra "−3" | Uma vez só, volta sozinho |

## Arco narrativo e pico e fim

| Momento | Hoje | Proposta |
| --- | --- | --- |
| Apresentação | Abre com o loop rodando | Papel fervendo e pontos de frame andando: a tela parece viva mesmo vazia |
| Gatilho | Primeiro traço | Avanço automático ligado no primeiro projeto |
| Ação crescente | Desenhar frame a frame | Cada traço já aparece animado no loop |
| **Pico** | Não definido | **O 8º traço fecha o loop e a animação aparece inteira, com grão.** É o momento a proteger. |
| Fim | Exportar | **Tiragem como ritual:** prévia do loop impresso, número da edição (1/1) e um botão de compartilhar. O fim é um objeto, não um diálogo de salvar. |

## Estratégia

**Trabalho a ser feito (JTBD).** Quando tenho uma ideia visual, quero transformá-la rapidamente num loop curto com cara de impresso, sem sair do tablet, pra ver se a ideia funciona e poder mostrá-la.
- *Emocional:* sentir que estou brincando e tocando, não operando software.
- *Social:* ter algo com identidade própria para postar e levar para outros trabalhos.

**Com quem o Grão disputa esse trabalho.** Caderno de papel (rápido, sem movimento); Procreate + After Effects (bonito, lento); FlipaClip e RoughAnimator no Android (animam, mas sem estética); Looom e Graintouch (perfeitos, só no iPad). O Grão é uma **fatia inovadora** (*innovative slice*): pega uma parte do que esses apps fazem e faz muito melhor, num oceano sem concorrência no Android.

**Resultado a perseguir (não lista de recursos).** Por ser ferramenta pessoal, o resultado é: **mais ideias viram loops terminados.**
- **Métrica-guia (North Star):** loops exportados por semana (8 frames ou mais).
- **HEART, só duas categorias:** *sucesso na tarefa* (tempo até o primeiro loop numa sessão nova; meta < 2 min) e *felicidade* (nota do traço de 1 a 5).
- Contagem feita só no aparelho, sem enviar nada a lugar nenhum.

**Árvore de oportunidades**

```
Resultado: mais ideias viram loops terminados
├── "Perco a ideia até abrir e configurar tudo"        → loop vivo ao abrir; projeto novo em 1 toque
├── "Animar frame a frame é lento e chato"             → avanço automático; roda de tempo
├── "Meu desenho digital parece limpo demais, sem alma" → motor riso; ferver; papel
└── "Ajustar uma pose me obriga a redesenhar"          → laço de traços inteiros
```

**Suposições mais arriscadas (testar primeiro)**

| Suposição | Tipo | Evidência hoje | Teste |
| --- | --- | --- | --- |
| A latência do traço no Chrome é aceitável | Viabilidade | Baixa | Câmera lenta na Fase 0 |
| A roda com fader é entendida sem explicação | Usabilidade | Baixa | 5 colegas, tarefa "deixe mais lento e ao contrário" |
| O grão é lido como impressão, não como filtro | Desejo | Média | Pedir a 5 pessoas que descrevam o visual, sem induzir |
| Você vai preferir o Grão ao caderno de papel para esboçar loops | Desejo | Baixa | Diário de 1 semana: quantas ideias viraram loops |
| Pegar traços inteiros basta para ajustar poses | Usabilidade | Média | Tarefa "mova e aumente a bola do frame 3" |

Formato das hipóteses: *"Acreditamos que congelar o loop ao segurar o laço fará o autor ajustar poses sem erro. Saberemos que acertamos quando 4 de 5 pessoas completarem a tarefa do laço sem ajuda."*

**Responsabilidade.** Risco baixo. Cuidados: nenhum dado sai do aparelho; espelhamento para canhotos e tintas com nome; respeitar licenças (Diorame e Pencil2D só para estudo); se for à loja, compra única em vez de assinatura, coerente com o espírito do projeto.

**Risco estratégico principal:** construir a ferramenta virar o projeto, no lugar de fazer arte com ela. Prazo fechado para a Fase 0 e conferir a métrica-guia a cada versão.

## Próximos passos

1. Aplicar no conceito os itens 1 a 5 (laço com pausa, polegar com uma tarefa, prato e fader, encostar = segurar, leituras na roda).
2. Incluir na Fase 0 o teste comparando roda de dois anéis com prato + fader.
3. Definir o pico (8º traço fecha o loop) e o ritual da tiragem no design do v0.1.
4. Ligar um contador local de loops exportados desde o v0.1.
