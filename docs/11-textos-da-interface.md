# 11 — Textos da interface

Como o Grão fala. Vale para botões, leituras, avisos, erros e documentação para quem usa o app.

## Voz

| Conceito | Como soa | Faz | Não faz |
| --- | --- | --- | --- |
| Ateliê | Calmo, de quem está desenhando junto | "Desfeito" | "Ação desfeita com sucesso!" |
| Direto | Curto, verbo primeiro | "Apagar seleção" | "Deseja realmente apagar os itens selecionados?" |
| De ofício | Usa termos de animação e de impressão que animadores conhecem | "Frame", "Ferver", "Retícula" | "Quadro-chave de vetor", "Ruído procedural" |
| Sem culpa | Erro é do sistema, com saída | "Não deu para salvar. Salve um arquivo para garantir." | "Erro: operação inválida." |

Tom: na maior parte do tempo, **confiante e mínimo** (a pessoa está no meio do desenho). Mais explicativo só
na primeira vez e nos erros. Sério só antes de apagar algo que não volta.

## Vocabulário (use sempre a mesma palavra)

| Use | Não use | Significa |
| --- | --- | --- |
| Tinta | cor, canal | Uma das cores riso (Rosa flúor, Azul…) |
| Camada | layer, folha | Folha de desenho com uma tinta (separada da tinta a partir da v0.4) |
| Frame | quadro, keyframe | Um desenho do loop |
| Loop | animação, timeline | A sequência que repete |
| Roda | dial | A roda de canto |
| Menu | mais, opções, configurações | O botão da roda com arquivo e ajustes (desde a v0.2.1) |
| Tempo | camadas (até a v0.4) | FPS e frames da tinta ativa |
| Prato | anel do tempo, jog | O anel externo da roda, que move o tempo |
| Velocidade | fps global, playback | O arco que acelera, freia ou inverte o loop |
| Pincel, Borracha, Laço, Balde | ferramenta de seleção, eraser | Ferramentas |
| Desfazer, Refazer | voltar, undo | Histórico |
| Ferver | tremer, boil | Reimprimir o grão 8 vezes por segundo |
| Papel | fundo, background | A base com fibras e cor |
| Exportar | baixar, salvar como | Gerar imagem ou vídeo para fora do app (PNG, GIF…) |
| Salvar arquivo, Abrir arquivo | exportar projeto, importar, baixar | Guardar o projeto num `.grao` e abrir de volta |

"Recorte" deixa de ser nome de ferramenta: a ferramenta é **Borracha** (o comportamento continua o mesmo,
apaga a tinta e mostra o papel).

## Regras de escrita

- Botões: verbo + objeto quando couber, com só a primeira letra maiúscula ("Exportar PNG", "Novo projeto").
  Na roda, uma palavra.
- Leituras passageiras: até 12 caracteres ("3/8", "1,5×", "Desfeito", "Parado").
- Avisos: até 14 palavras. Erros: **o que falhou. Por quê, se ajudar. O que fazer.**
- Números em algarismos, vírgula decimal ("1,5×"), sem ponto final em botões e leituras.
- Nada de "Ops!", exclamação ou emoji em mensagens.
- Todo ícone tem rótulo para leitor de tela (`aria-label` ou equivalente na roda desenhada em canvas).

## Textos de referência

| Onde | Texto |
| --- | --- |
| Leitura: desfazer / refazer | Desfeito · Refeito |
| Leitura: nada para desfazer | Nada para desfazer |
| Leitura: tempo | 3/8 · 1,5× · Parado · Tocando |
| Leitura: roda de histórico | Histórico · gire para voltar |
| Chips de seleção | Duplicar → · Apagar |
| Aviso: remover frame com desenho | Esse frame tem desenho. Apague antes de remover. |
| Aviso: limite de frames | Máximo de 12 frames por camada. |
| Erro: salvar | Não deu para salvar. O navegador recusou o espaço. Salve um arquivo para garantir. |
| Erro: sem WebGL2 | O Grão não abriu. Este navegador não desenha com a GPU. Use o Chrome atualizado. |
| Erro: aberto pelo arquivo | Abra pelo Live Server. O endereço precisa começar com http:// |
| Confirmação: novo projeto | Começar um projeto novo? O desenho atual será apagado deste aparelho. · Apagar e começar · Cancelar |
| Sucesso: exportar | PNG exportado |
| Menu (rótulos) | Nome do projeto · Salvar arquivo · Abrir arquivo · Novo projeto · Exportar PNG · Impressão · Papel · Grão · Desalinhamento · Ferver · Desenho e roda · Auto · Fixar roda · Canhoto · Teste da Fase 0 |
| Menu: estado do salvamento | Salvando… · Salvo neste aparelho às 14:32 · Não deu para salvar neste aparelho. Salve um arquivo. |
| Aviso: arquivo salvo | Arquivo salvo. Procure em Downloads. |
| Confirmação: abrir arquivo | Abrir "nome"? O desenho atual será trocado. Salve um arquivo antes, se quiser guardar. · Abrir · Cancelar |
| Erro: abrir arquivo | Não deu para abrir. Esse arquivo não é um projeto do Grão. |
| Sucesso: abrir | Projeto aberto |
| Pétala Tinta (rótulos) | Tintas · Cor da tinta |
| Folha Tempo | Tempo da tinta Rosa flúor · FPS · Frames · Cada tinta tem o próprio loop. Duração: 1 s. |
| Dica de 2 dedos | 2 dedos sobre a seleção: girar e escalar |
| Leitura: botão da caneta | Borracha · Pincel · Laço |
| Leitura: linha reta | Linha |
| Leitura: balde em cima da linha | Nada para pintar |
| Erro: PNG | Não deu para exportar o PNG. Tente de novo. |
| Pétala Ferramenta | Pincel · Lápis · Marcador · Giz · Borracha · Balde · Laço · Tamanho |
| Leitura: zoom | 200% · 100% |
| Menu: zoom e traço | Encaixar papel (100%) · Suavizar traço |
| Menu: vídeo | Exportar vídeo do loop |
| Aviso: gravando | Gravando o loop: 3 s. Espere terminar. |
| Sucesso: vídeo | Vídeo exportado (MP4). Procure em Downloads. |
| Erro: vídeo | Não deu para gravar o vídeo. Tente de novo ou exporte um PNG. · Este navegador não grava vídeo. Use o Chrome atualizado. |

## Textos da v0.3.2 e da v0.4 (decididos em 24/11)

### Vocabulário novo

| Use | Não use | Significa |
| --- | --- | --- |
| Camada | layer, folha | Folha de desenho; imprime com uma das 4 tintas (v0.4) |
| Tinta | tambor, cor | Uma das 4 cores do projeto. "Tambor" só em documentação técnica |
| Retícula | halftone, screen, trama | Como a tinta vira pontos |
| Estocástica | FM, dither, aleatória | Pontos espalhados ao acaso (o grão) |
| Reticulada | AM, pontos em grade, halftone | Pontos em grade, com ângulo |
| Densidade | opacidade, tom, % de tinta | Quanto de tinta a retícula deixa (10–100%) |
| Lineatura | lpi, resolução da retícula | Quantas linhas de pontos por polegada (na interface: "Lineatura · 60") |
| Régua | timeline, linha do tempo | A faixa de frames que aparece ao arrastar 2 dedos |
| Riscar · Mexer | desenho · edição | Os dois arcos da pétala Ferramenta |

### Gestos (item "Gestos" do Menu)

Título: **Gestos com 2 dedos**

| Gesto | Texto |
| --- | --- |
| Tocar rápido | Desfaz o último passo. |
| Arrastar para os lados | Anda no tempo, frame a frame. Com o papel inteiro na tela. |
| Abrir ou fechar os dedos | Aproxima e afasta o papel. Com zoom, arrastar move o papel. |
| Sobre a seleção | Move, gira e muda o tamanho do que foi selecionado. |

Rodapé: "A palma apoiada é ignorada enquanto a caneta está perto da tela."

### Leituras e avisos

| Onde | Texto |
| --- | --- |
| Primeira abertura da 0.3.2 | Novo: 2 dedos para os lados andam no tempo |
| Gesto de tempo | 3/8 (mesma leitura do prato) |
| Camada travada (tentou desenhar) | Camada travada |
| Limite de camadas | Máximo de 8 camadas. |
| Apagar camada com desenho | Apagar a camada 3? O desenho dela some de todos os frames. · Apagar camada · Cancelar |
| Folha da camada: rótulos | Tinta · Retícula · Estocástica · Reticulada · Densidade · Visível · Travar · Subir · Descer · Duplicar camada · Apagar camada |
| Menu → Impressão | Lineatura · 40 · 60 · 85 |
| Leitura com muitas camadas | C2 · 3/8 |
