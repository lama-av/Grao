# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Versões seguem `MAIOR.MENOR.CORREÇÃO`.

## [Não lançado]

## [1.0.0-rc.4] — 2026-11-24

Pedidos do Raphael depois do 3º teste no tablet (pedido #067).

### Adicionado
- **Refazer com toque rápido de 3 dedos** (exceção à decisão 2: "nada de 3 dedos").
- **Tour do Grão:** tutorial completo de 17 passos com holofote em cada parte (papel, caneta, dedo, roda, prato,
  velocidade, desfazer/refazer, ferramentas, camadas e retícula, tempo, menu, gestos, seleção, impressão e exportação).
  A roda abre e mostra as pétalas sozinha durante o tour. Começa na primeira vez no aparelho; Menu → Tour do Grão.
- **Dedo com sensibilidade** quando o aparelho mede a pressão do dedo (valor entre 0 e 1 que não seja o 0,5 fixo);
  senão, pressão fixa. A caneta continua com a pressão dela.

### Mudado
- **Pinça mais imediata:** o zoom começa assim que os dedos abrem ou fecham ~16 px (antes, depois de 24 px de
  movimento).
- Folha "Gestos com os dedos" inclui o toque de 3 dedos e o botão do tour.
- Teste de lógica: 290 verificações.

## [1.0.0-rc.3] — 2026-11-24

Segundo teste do Raphael no tablet (pedido #066): os toques continuavam todos "palma" (de 30 a 80 px de contato),
e a opção "Desenhar com o dedo" não aparecia no Menu.

### Corrigido
- **Todo toque virava palma:** o filtro ignorava os dedos sempre que a caneta estava **pairando** perto da tela. Com a
  caneta na mão de desenho, ela fica a poucos centímetros e manda sinal o tempo todo. Agora só é palma o toque com a
  caneta **encostada**, até 0,3 s depois de ela levantar, ou com contato maior que 120 px.
- **A versão nova não chegava ao tablet:** o aviso "Nova versão. Toque para atualizar." só aparecia com o loop parado.
  Agora aparece sempre que a roda está recolhida, e o Menu ganhou **Atualizar agora**. Menu e painel mostram a build.

### Mudado
- **Dedo e caneta juntos, sem opção** (pedido do Raphael): o dedo desenha como a caneta (sem sensibilidade) quando a
  caneta não está perto. Com a caneta pairando, o dedo não risca (para a palma não desenhar), mas os gestos de 2
  dedos funcionam. Um segundo dedo descarta o risco do primeiro e vira gesto. A opção "Desenhar com o dedo" saiu.
- Painel Teste da Fase 0: versão e **motivo do último toque ignorado** (caneta encostada, caneta acabou de sair,
  contato largo).
- Teste de lógica: 279 verificações.

## [1.0.0-rc.2] — 2026-11-24

Correções do primeiro teste do Raphael no tablet com a rc.1 (pedido #065).

### Corrigido
- **Gestos de 2 dedos e transformar a seleção com os dedos não funcionavam:** o filtro de palma ignorava toques com
  mais de 40 px de contato, e a ponta de um dedo no tablet já passa disso. Agora só acima de 120 px (palma).
- **Dicas não apareciam** para quem já tinha projeto (só vinham no projeto de boas-vindas). Agora aparecem uma vez por
  aparelho, em qualquer projeto; Menu → Gestos → "Mostrar as dicas de novo".
- **Várias janelas abertas ao mesmo tempo:** abrir uma pétala (Ferramenta, Camadas) agora fecha o Menu/Tempo.
- **Divisão no anel de frames** (lado direito da roda): o anel agora é contínuo e tem uma marca no frame 1, no alto.

### Adicionado
- **Retícula fácil de achar:** tocar de novo na camada ativa (pétala Camadas) ou na pastilha **Ajustes** abre a folha da
  camada (tinta, retícula, visível, travar, ordem). O toque longo continua valendo.
- **Tamanho até 200** em todas as ferramentas; o arco de Tamanho é mais fino nos tamanhos pequenos.
- **Desenhar com o dedo** (Menu → Desenho e roda, desligado por padrão): o dedo usa a ferramenta como a caneta, sem
  sensibilidade. Um segundo dedo descarta o risco e vira gesto; perto da seleção o primeiro dedo espera o segundo.
  Sem caneta e com a opção desligada, depois de duas tentativas aparece "Sem caneta? Menu → Desenhar com o dedo."

### Mudado
- Decisão 2 do `CLAUDE.md`: "toque de 1 dedo nunca desenha" ganhou a exceção da opção acima (pedido do Raphael).
- Teste de lógica: 277 verificações.

## [1.0.0-rc.1] — 2026-11-24

Candidata a 1.0. Todos os recursos do roteiro até a 1.0 (doc 13) estão no app. Para virar 1.0.0 falta o que só o
tablet e pessoas verificam: latência, desempenho, sessão de 1 hora, teste com 3 pessoas (pedido #064).

### Adicionado
- `docs/relatorio-v1.0.md`: relatório detalhado da rodada 0.3.2 → 1.0.0-rc.1 (versões, decisões do VS Code, riscos,
  critérios da 1.0).
- `docs/15-lista-de-testes.md`: lista completa de testes no tablet, por área, com o pedido de cada item.

### Mudado
- `README.md`, `INSTRUCOES.txt`, `docs/README.md` e `src/README.md` reescritos para a 1.0.
- Créditos conferidos: o app não usa biblioteca de terceiros (o crédito ao perfect-freehand saiu, porque o traço não
  usa esse algoritmo); cores pela Stencil Wiki e riso-colors; referências Secret Riso Club e Risotrip.

## [0.9.0] — 2026-11-24

Beta: estabilidade. Pedidos #060–#063 (escritos pelo VS Code a partir do roteiro). Recursos congelados.

### Adicionado
- **Qualidade automática** (#060): se o tablet passar de ~21 ms por quadro (menos de ~48 quadros/s) por 1,5 s, o
  compositor riso desenha em resolução menor (1,5× → 1× → 0,75× → 0,5× da densidade da tela); volta a subir depois de
  ~10 s rodando a 60 Hz. Traço molhado e roda continuam nítidos. Menu → Qualidade automática; painel mostra o nível.
- **Não perder desenho** (#061): salva também ao sair da página (`pagehide`) e pede ao navegador armazenamento
  persistente (não apagar os projetos quando faltar espaço).

### Corrigido (revisão de código da 0.3.1 à 0.9, #062)
- Separações: todas as tintas saem do mesmo instante (antes cada tinta podia sair de um frame, com o loop tocando).
- Exportar com voltas não corta mais o loop no meio (voltas inteiras que cabem em 12 s).
- GIF/PNGs com camadas de FPS diferentes saem a 24 quadros/s (antes, frames de duração desigual).
- Caneta cancelada pelo sistema não deixa mais os gestos de 2 dedos presos como "palma".
- A qualidade automática não muda durante gravação/exportação (o vídeo mudaria de tamanho) e volta a subir a 60 Hz.
- Erro no começo de uma exportação não trava mais o papel e a roda; a prova libera a memória da GPU sempre.
- Trocar de projeto esquece as tintas de antes do Falso CMYK e as dicas da primeira vez.
- Antes de exportar, as máscaras são preparadas respeitando o limite por quadro (antes, tudo de uma vez).

### Mudado
- Teste de lógica: 265 verificações.

## [0.8.0] — 2026-11-24

Primeira vez, textos e acessibilidade. Pedidos #055–#059 (escritos pelo VS Code a partir do roteiro).

### Adicionado
- **Projeto de boas-vindas** (#055): na primeira abertura no aparelho, o Grão abre com uma bola quicando (contorno
  em Preto, miolo em Rosa por balde, chão em Azul) já tocando, e **3 dicas no papel**: "Desenhe com a caneta…",
  "Toque aqui: a roda…", "Arraste 2 dedos para os lados…". Cada dica some quando a pessoa faz o que ela diz.
- **Leitor de tela** (#057): as leituras da roda ("Desfeito", "3/8"…) vão para uma região `aria-live`.
- **Movimento reduzido** (#057): com essa opção do sistema, a roda abre sem animação.
- `docs/14-teste-com-pessoas.md` (#058): roteiro do teste com 3 pessoas (para o Raphael aplicar).

### Mudado
- **Roda com alvos de 48 px** (#057): anel de setores e prato com 48 px de espessura (antes 44 e 40); a roda aberta
  tem 264 px; pétalas e arcos foram para fora na mesma proporção. Caixas de marcar com 48 px de altura.
- **Textos revisados** (#056) contra o doc 11; corrigido "PNGs exportado" → "PNGs exportados".
- Teste de lógica: 255 verificações.

## [0.7.0] — 2026-11-24

Riso completo. Pedidos #048–#054 (escritos pelo VS Code a partir do roteiro do doc 13).

### Adicionado
- **Sobreimpressão por passada** (#048): as tintas imprimem na ordem das camadas (de baixo para cima); cada passada
  multiplica sobre o papel e cobre um pouco a tinta de baixo (preto cobre mais, amarelo e fluorescentes quase nada).
  A ordem das camadas agora muda a cor, como na riso.
- **Desalinhamento que cresce com as passadas** (#049): 1ª tinta 45% do máximo, depois 70%, 88% e 100%.
- **Formas de ponto da reticulada** (#050): Redondo, Linha, Elipse (folha da camada).
- **Prova de impressão** (#051): Menu → Impressão. O frame atual vira uma folha riso parada em 2400 × 1600, com nome,
  data, tintas e papel; "Salvar prova (PNG)".
- **Separações para a gráfica** (#052): Exportar → Separações. Um PNG cinza por tinta (preto = tinta, 5% a 100%),
  300 dpi num A4 (3508 × 2339), nome da tinta no arquivo, num .zip; sem grão e sem retícula. O desenho é refeito em
  alta resolução direto dos traços (a máscara da tela daria só ~80 dpi).
- **Imperfeições opcionais** (#053, desligadas por padrão): Marcas de rolo (faixas claras onde a folha está muito
  carregada) e Transferência (fantasma espelhado e fraco do verso).

### Mudado
- Teste de lógica: 249 verificações, com uma checagem estática do shader (uniforms declarados, chaves, número de
  texturas), já que não há compilador de GLSL nesta máquina.

## [0.6.0] — 2026-11-24

Projetos e exportação. Pedidos #043–#047 (escritos pelo VS Code a partir do roteiro).

### Adicionado
- **Galeria de projetos** (#043): Menu → **Projetos** lista os projetos guardados no aparelho, com miniatura, nome e
  data: Abrir, Duplicar, Apagar (com confirmação). **Novo projeto** não apaga mais nada: o atual fica na galeria.
  O projeto das versões anteriores entra na galeria sozinho na primeira abertura.
- **Exportar GIF** (#044): codificador próprio (`src/io/gif.js`), paleta por quadro, laço infinito, grão fervendo.
- **Sequência de PNG** (#045): um PNG por quadro num `.zip` (`src/io/zip.js`).
- **Folha Exportar** (#046): GIF, Vídeo, PNGs (.zip) ou PNG do frame; escala 50% / 100% / 200%; 1, 2 ou 3 voltas.
  GIF e PNGs são desenhados fora da tela, um quadro por vez: o loop continua e o papel não pisca.
- Arquivo `.grao` aberto vira um projeto novo na galeria (não sobrescreve outro).

### Mudado
- Menu: "Projetos", "Novo projeto" e "Exportar…" no lugar de "Novo projeto", "Exportar PNG" e "Exportar vídeo".
- Teste de lógica: 236 verificações (LZW do GIF com decodificador, CRC32 e estrutura do ZIP, plano de quadros, uid).

## [0.5.0] — 2026-11-24

Tempo: editar a animação sem sair do papel. Pedidos #036–#042, escritos pelo VS Code a partir do roteiro (doc 13),
a pedido do Raphael ("execute os pedidos até a versão 1.0, sem pausas").

### Adicionado
- **Tira de frames** na folha Tempo (#036): miniatura de cada frame da camada ativa (com os baldes), número e
  exposição; tocar vai para o frame e para o loop.
- **Operações de frame** (#037): Inserir (vazio depois do atual), Duplicar, Apagar, ← Mover, Mover →; "+" e "−" no
  fim. Tudo no desfazer.
- **Exposição** (#038): o frame atual fica ×1 a ×4 tempos. O relógio, o prato, a régua, o gesto de tempo, as paredes
  do balde e o vídeo contam a exposição. A régua mostra a exposição como uma barra.
- **Copiar e colar** (#039): chip "Copiar" junto da seleção; com algo copiado e o loop parado, o chip "Colar" aparece
  no alto e cola no frame atual da camada ativa (outra camada ou outro frame), no mesmo lugar, já selecionado.
- **Papel-cebola configurável** (#040): Menu → Desenho e roda: até 2 frames antes e 2 depois, e a intensidade.
- **Auto melhorado** (#041): pode voltar em vez de avançar e pode parar no último frame (no primeiro, voltando).

### Mudado
- Folha "Tempo" ficou mais larga (300 px) para a tira de frames.
- Teste de lógica: 222 verificações.

## [0.4.0] — 2026-11-24

Camadas, retícula e uso sem internet (pedidos #028–#033 e #035, escritos pelo chat; feitos sem a pausa de auditoria,
a pedido do Raphael). Arquitetura: ADR-004.

### Adicionado
- **Camadas separadas das tintas** (#028): o projeto tem 4 tintas (tambores) e de 1 a 8 camadas. Cada camada imprime
  com uma tinta, tem o próprio loop, visível, travada e retícula. Ordem de impressão = ordem das camadas. Camadas da
  mesma tinta se juntam sem escurecer. Projetos antigos abrem com 4 camadas, sem mudança visual.
- **Pétala Camadas** (#029, antigo setor Tinta): uma pastilha por camada (cor da tinta, número, apagada = invisível,
  cadeado = travada) e "+" para criar; por fora, as 9 cores para a tinta da camada ativa. **Toque longo numa camada**
  abre a folha da camada: Tinta (tambor e cor), Retícula, Visível, Travar, Subir, Descer, Duplicar, Apagar.
- **Retícula por camada** (#030): **Estocástica** (padrão, o grão) ou **Reticulada** (pontos redondos em grade, ângulo
  por tinta 15°/75°/0°/45°), **Densidade** de 5% a 100%. Lineatura 40/60/85 no Menu → Impressão. Abaixo de 10% os
  pontos falham ao acaso; áreas cheias imprimem irregulares acima de 50%.
- **Desalinhamento calibrado:** o máximo agora é 3 mm num A4 (antes ~1,2 mm); o padrão fica em ~1,5 mm.
- **Tempo por camada** (#031): folha Tempo, prato, régua e gesto andam na camada ativa; leitura "C2 · 3/8" com mais de
  4 camadas.
- **Trapping** (#033): o balde avança 0,5 mm por baixo das linhas que o seguram (ligado por padrão; Menu → Impressão).
- **Tintas prontas** (Menu → Impressão): Falso CMYK (Azul, Vermelho vivo, Amarelo, Preto) e "Do projeto".
- **Abrir sem internet** (#035): service worker (`sw.js`) guarda o app; versão nova aparece no botão da roda ("Nova
  versão. Toque para atualizar."), só com o loop parado; nunca recarrega sozinho.
- Desfazer cobre criar, apagar, reordenar, duplicar camada, tinta, cor do tambor, visível, travar e retícula.

### Mudado
- Arquivo `.grao` versão 2 (`inks` + camadas com `id`, `visible`, `locked`, `screen`). O `sanitize` migra a versão 1.
- Máscaras guardadas pelo id da camada (reordenar e desfazer não refazem máscaras).
- Teste de lógica: 200 verificações (migração, limites, operações e desfazer de camadas, tintas prontas, trapping,
  service worker).

### Não verificado
- O shader novo não foi compilado nesta máquina (o validador da Khronos foi bloqueado pelas permissões). Revisado à mão
  contra as regras do GLSL ES 3.00. **Se o app abrir com a caixa vermelha "Shader: …", mande um print.**

## [0.3.2] — 2026-11-24

Gestos, Vermelho vivo e preparação da auditoria (pedidos #022–#027 e #034, escritos pelo chat).

### Adicionado
- **Arrastar 2 dedos para os lados anda no tempo** (#023): com o papel em 100%, 48 px = 1 frame da tinta ativa
  (direita = para frente). O loop espera enquanto os dedos estão na tela; uma **régua de frames** aparece na borda de
  baixo e some 400 ms depois de soltar; leitura "3/8". Com zoom, arrastar continua movendo o papel.
- **Palma não vira gesto** (#024): toques que começam com a caneta encostada, pairando ou até 300 ms depois, e toques
  com contato maior que 40 px, são ignorados até sair. A roda nunca é filtrada. Painel Teste da Fase 0: "toques
  ignorados" e o tamanho do último toque.
- **Menu → Gestos** (#025): os 4 gestos de 2 dedos. Na primeira abertura: "Novo: 2 dedos para os lados andam no tempo".
- **Pétala Ferramenta em dois arcos** (#026): Riscar (Pincel, Lápis, Marcador, Giz) perto; Mexer (Borracha, Balde,
  Laço) fora; o arco de Tamanho foi para fora dos dois.
- **Vermelho vivo** (#034), 9ª tinta (`#F15060`, Riso Bright Red), para o falso CMYK. Pastilhas de cor com 48 px.

### Mudado
- Gestos de 2 dedos saíram do `input.js` para `src/input/gestures.js` (máquina de estados, ADR-003) (#022).
- Pinça decidida pela mudança de distância **comparada ao deslocamento do meio dos dedos**: os eventos chegam um dedo
  de cada vez, e só "a distância mudou 10%" confundia arrastar com pinça.
- Teste de lógica: 164 verificações.

## [0.3.1] — 2026-11-24

Fecha a v0.3 do plano ("Papel e ferramentas"): zoom, pincéis e suavização.

### Adicionado
- **Zoom e mover o papel** (T-020, #019): 2 dedos **fora** da seleção fazem pinça (zoom de 100% a 400%) e arrastam
  o papel. Soltar perto de 100% encaixa o papel inteiro. Leitura "200%" na roda. **Encaixar papel (100%)** no Menu.
  O toque rápido de 2 dedos continua desfazendo; 2 dedos **sobre** a seleção continuam girando a seleção.
  O grão é do papel: com zoom, ele aumenta junto. PNG e vídeo sempre saem com o papel inteiro.
- **Pincéis** (T-021, #020) na pétala Ferramenta: **Pincel**, **Lápis** (metade da largura, tom de 62%: o grão do
  riso quebra o traço como grafite), **Marcador** (largura fixa, sem pressão) e **Giz** (carimbos falhados, sempre
  iguais para o mesmo traço). Cada ferramenta tem o **próprio tamanho** (a Borracha também). O botão 1 da caneta
  alterna a Borracha com o último pincel usado. O botão da roda mostra L, M ou G no miolo.
- **Suavizar traço** (T-025, #021) no Menu: de 0 (desligado, padrão) a 1. O traço segue a caneta com atraso e
  alcança o último ponto ao soltar.

### Mudado
- Projetos antigos (um tamanho só) abrem com esse tamanho no Pincel e na Borracha.
- Teste de lógica: 129 verificações (zoom, pinça, pincéis, giz igual na tela e na máscara, suavização).

## [0.3.0] — 2026-11-24

Ferramentas pedidas pelo Raphael (balde, linha) e exportar vídeo. Do plano da v0.3 ficam para a 0.3.1: zoom e mover
o papel (T-020), pincéis Lápis/Marcador/Giz (T-021) e suavização (T-025).

### Adicionado
- **Balde** (pétala Ferramenta): um toque preenche a área fechada com a tinta da camada. Buracos pequenos na linha
  (até ~4 px) não deixam vazar. **Linhas de outras tintas também seguram o balde** (linha preta, preenchimento rosa),
  usando o frame de cada tinta que aparece junto naquele tempo do loop. O balde guarda só o ponto tocado e a área é refeita com a máscara: mover, girar ou
  duplicar as linhas leva o preenchimento junto. Entra no laço e no desfazer (T-022, #014).
- **Linha reta:** no fim de um traço, segurar a caneta parada 0,5 s endireita a linha (leitura "Linha"); depois, a
  ponta da linha segue a caneta até soltar. Vale para Pincel e Borracha (T-023, #015).
- **Exportar vídeo do loop** (Menu): grava o loop tocando desde o frame 1, em ciclos inteiros (mínimo 3 s, máximo
  12 s), em **MP4** quando o Chrome sabe gravar, senão WebM. Ponto vermelho no botão da roda enquanto grava. Parte do
  T-052, trazida da v0.6 (#016).
- PNG e vídeo exportados usam o nome do projeto.

### Corrigido
- Mover a seleção (caneta ou 2 dedos) cancelado pelo sistema deixava a seleção fora do lugar, sem passo de desfazer.
  Agora volta ao lugar (#017).
- Tocar dentro da seleção sem mover criava um passo vazio no desfazer (#017).
- Revisão de código (#018): desfazer (ou abrir arquivo) no meio de um giro com 2 dedos podia quebrar e travar os
  gestos de 2 dedos até recarregar; agora o giro para sem tocar em nada. Botão 2 da caneta que o Android trata como
  "borracha" (contato chega como 32) agora faz laço. Vídeo: nada segura o loop durante a gravação e o papel e a roda
  ficam bloqueados (antes podia sair congelado com papel-cebola). "Salvo às…" não aparece mais com mudança pendente.
  Tocar no fundo escuro da caixa de confirmação não cancela mais (palma).
- Balde tocado em cima de uma linha não grava nada (antes virava um passo invisível no desfazer); leitura
  "Nada para pintar".

### Mudado
- Máscaras: quando o mesmo frame recebe só traços novos no fim, desenha só os novos (sem refazer os baldes).
  Mover/girar e desfazer continuam refazendo tudo.
- Máscaras são refeitas com limite de ~8 ms por quadro (`src/schedule.js`); frame com balde sendo movido é refeito
  no máximo a cada 120 ms; abrir um arquivo refaz as máscaras aos poucos, sem travar o loop.
- PNG exportado por `toBlob` (mesmo caminho de download do arquivo e do vídeo).
- Teste de lógica: 98 verificações (balde, paredes entre tintas, linha reta, vídeo, agenda de máscaras, giro
  interrompido, botão 32, mover cancelado).

## [0.2.1] — 2026-11-24

Atende às duas queixas do teste da b6 (D3 do `HANDOFF.md`): menu principal e cores escondidas.

### Adicionado
- **Menu** (antigo setor "Mais"): nome do projeto, **Salvar arquivo**, **Abrir arquivo**, Novo projeto e Exportar PNG no topo; depois Impressão (Papel, Grão, Desalinhamento, Ferver) e Desenho e roda (Auto, Fixar roda, Canhoto, Teste da Fase 0). Mostra "Salvando…" / "Salvo neste aparelho às 14:32" (#010).
- **Arquivo de projeto `.grao`:** Salvar arquivo baixa o projeto inteiro (vai para Downloads no tablet); Abrir arquivo escolhe um `.grao` no aparelho e pergunta antes de trocar o desenho atual. T-051 trazido da v0.6 para cá (#010).
- **Cores à vista na pétala Tinta:** além das 4 tintas, um segundo arco mostra as 8 cores possíveis para a tinta ativa; tocar troca a cor e a pétala fica aberta. Um ponto marca a cor que outra tinta já usa. O toque longo continua funcionando (#011).
- Dica "2 dedos sobre a seleção: girar e escalar" junto dos chips, nas 5 primeiras seleções do aparelho (#013).

### Mudado
- Setor "Camadas" virou **Tempo** (a folha só tem FPS e frames da tinta ativa, e agora mostra a duração do loop). As camadas de verdade chegam na v0.4 (#012).
- Abrir um projeto confere cada campo: traço estragado é descartado, valores inválidos voltam ao padrão, sempre 4 tintas.
- Aviso de erro de salvar sugere "Salve um arquivo" em vez de "Exporte um PNG".
- O aviso (toast) nunca recebe toques: antes podia roubar a caneta embaixo, no centro da tela.
- Teste de lógica: 60 verificações (arquivo `.grao`, arquivo estragado, arco de cores, projeto novo).

## [0.2.0] — 2026-11-24

Tela limpa e roda de canto. Fechada depois da sessão de animação do Raphael no tablet ("funcionou tudo certo").
Relatório da versão para a auditoria: `docs/relatorio-v0.2.md`.

### Adicionado
- Papel em tela cheia; a zona do polegar saiu. Interface nova: **roda de canto** desenhada num canvas por baixo do traço (ADR-002).
- Roda recolhida (64 px): tinta ativa, ferramenta (cheio = Pincel, vazado = Borracha, tracejado = Laço), frames e parado. Segurar e arrastar leva a outro canto (fica salvo).
- Roda aberta: centro toca/pausa; setores Desfazer, Refazer, Tinta, Ferramenta, Camadas, Mais; prato do tempo; arco de velocidade (encaixa em 1× e 0×). Recolhe ao desenhar, salvo com "Fixar roda".
- Refazer. Leituras "Desfeito", "Refeito", "Nada para desfazer", "Nada para refazer".
- Pétala Tinta (toque longo troca a cor) e pétala Ferramenta: Pincel, Borracha (antigo Recorte), Laço fixo e Tamanho com prévia. Toque e toque, ou encostar, arrastar e soltar (#008).
- **Botões da caneta (#009):** o botão lateral 1 **alterna** Pincel e Borracha a cada aperto (no ar ou encostada); o botão lateral 2 **segura o Laço** enquanto está apertado (o loop congela). Funciona com a ponta encostando depois do botão (o Chrome avisa isso por `pointermove`).
- Folha Mais (ajustes) e folha Camadas (FPS e frames). Chips "Duplicar →" e "Apagar" junto da seleção. Painel de teste no canto oposto à roda.
- Caixa de confirmação própria para "Novo projeto": "Apagar e começar" / "Cancelar" (doc 11).
- `tests/logic_test.mjs`: teste de lógica que roda sem navegador (Node que vem com o VS Code): caneta, botões da caneta, laço, roda, pétalas, 2 dedos. 42 verificações passando.
- `INSTRUCOES.txt` (como usar o Grão), `docs/12-tintas-riso.md` (tintas riso pela Stencil Wiki) e `docs/relatorio-v0.2.md`.
- `teste-caneta.html` (Fase 0 no tablet, com "Copiar resultados") e `diag.html` (WebGL por partes). Caixa vermelha de erros e aviso de versão ao abrir.

### Mudado
- Ações do app (desfazer, seleção, projeto novo) saíram do `main.js` para `src/actions.js`, para o teste usar o mesmo código.
- "Novo projeto" mantém o canto da roda e o modo Canhoto.
- Botão lateral da caneta: antes **segurava** a Borracha; agora **alterna** (pedido do Raphael, 24/11).

### Corrigido
- Canvas todo preto no tablet (Chrome do Android): o modo baixa latência deixava a camada de cima opaca. Agora vem desligado; para testá-lo, abrir com `?baixa=1`.
- Botão da caneta apertado com a caneta no ar podia começar um traço invisível (apagando no ar) ou acionar a roda: agora no ar ele só troca de ferramenta.

### Falta
- `tests/smoke_test.py` (Playwright, com GPU) não foi rodado nesta máquina; o teste de lógica cobre as regras.
- Latência sem baixa latência ainda não foi medida com vídeo em câmera lenta.

## [0.1.0] — 2026-11-23

Primeira build: caderno web/PWA para testar no tablet (Fase 0 + núcleo do caderno).

### Adicionado
- Desenho com caneta: espessura pela pressão, pontos intermediários (`getCoalescedEvents`), traço molhado em canvas de baixa latência. Palma ou dedo nunca desenham.
- Recorte: botão Recorte, ou botão lateral da caneta segurado, apaga como papel.
- 4 tintas riso (riso-colors, MIT); toque longo numa tinta abre cor, FPS (6/8/12/24) e quantidade de frames (1–12).
- Compositor riso em WebGL2: papel com fibras e impurezas, grão, desalinhamento por tinta, "ferver" (8 reimpressões por segundo), papel-cebola quando o loop está parado.
- Laço segurado: enquanto o botão está apertado o loop congela e a caneta faz a seleção. Mover com a caneta; girar, escalar e mover com 2 dedos pousados sobre a seleção (+80 px de folga). Duplicar para o próximo frame; Apagar.
- Roda de tempo (prato): encostar segura o disco; 30° = 1 frame; centro toca/pausa. Fader de velocidade de −2× a 2× (encaixa em 1×; toque duplo volta a 1×).
- Desfazer: botão, ou toque rápido com 2 dedos. Depois do botão, a roda vira roda de histórico por 3 s.
- Auto: com o loop pausado, cada traço avança um frame.
- Leituras na zona do polegar (frame, velocidade, estado). Modo Canhoto. Painel "Teste da Fase 0" (pressão, inclinação, eventos/s, quadros/s, baixa latência).
- Salvamento automático no navegador (IndexedDB). Exportar PNG.
- Teste automático em Chrome sem tela: desenho, auto, toque de 1 dedo, laço, mover, duplicar, desfazer com 2 dedos, roda e recarregar.

### Decidido na build
- Uma seleção ativa também segura o loop parado (como o Laço), para o desenho não fugir enquanto é ajustado.

### Falta (próximas versões)
- Exportar vídeo, GIF e SVG por tinta; só PNG por enquanto.
- Pan e zoom do papel.
- Service worker (abrir sem rede).
- Sobreimpressão física (passadas por tinta); hoje as tintas se multiplicam numa passada só.
- Cada traço confirmado copia a máscara da CPU para a GPU (aviso "GPU stall due to ReadPixels" no teste); medir no tablet.

### Adicionado
- Estrutura do projeto e documentação: conceito, decisão do MVP, plataforma-alvo, design do sistema v0.1, motor riso, referências, roadmap, testes da Fase 0.
- ADR-001: plataforma do v0.1 (web/PWA), status Proposto.
- `CLAUDE.md` com contexto e regras para sessões com IA.
