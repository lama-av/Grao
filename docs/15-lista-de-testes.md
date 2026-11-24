# 15 · Lista de testes no tablet (1.0.0-rc.1)

**Para quem:** o Raphael, no XPPen Magic Drawing Pad, e o chat na auditoria.
**Como usar:** marque **ok** ou descreva o **problema** (com print ou vídeo curto se puder). P1 = trava o uso,
P2 = atrapalha, P3 = detalhe. A coluna **Pedido** aponta para o `HANDOFF.md`.

**Antes de começar:**
1. Abra https://lama-av.github.io/Grao/ e confira o aviso: **`Grão 1.0.0-rc.1-b18`**.
2. Se aparecer a caixa vermelha com "Shader: …", pare e mande print: o shader não pôde ser compilado no PC.
3. Para ver o projeto de boas-vindas: limpe os dados do site antes (perde os projetos guardados; salve arquivos).

## A. Abrir, primeira vez, sem internet

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| A1 | Com dados limpos: abre a bola quicando e as 3 dicas no papel | #055 | |
| A2 | Cada dica some ao fazer o que diz (desenhar, abrir a roda, 2 dedos para os lados); no fim, aviso "Pronto…" | #055 | |
| A3 | Instalar (Adicionar à tela inicial), desligar o Wi-Fi, abrir e desenhar | #035 | |
| A4 | Projeto da 0.3.x abre igual (se tiver um `.grao` antigo) | #028 | |

## B. Caneta, palma e latência

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| B1 | Traço acompanha a caneta; pressão muda a espessura | — | |
| B2 | **Latência:** vídeo em câmera lenta (240 fps) do `teste-caneta.html`, contar quadros entre ponta e traço: ___ ms (meta < 50 ms; decide o ADR-001) | #027 | |
| B3 | Botão 1 da caneta alterna Borracha ↔ último pincel (no ar e encostada) | #009, #020 | |
| B4 | Botão 2 da caneta: segurar, encostar e contornar faz laço; soltar volta ao normal | #009 | |
| B5 | Linha reta: parar 0,5 s antes de soltar endireita; desenhar devagar não endireita sem querer | #015 | |
| B6 | Palma apoiada desenhando por 2 min: nenhum zoom, desfazer ou passo de tempo por acidente | #024 | |
| B7 | Painel Teste da Fase 0: "último toque" mostra largura/altura reais (não 1 × 1)? ___ | #024 | |

## C. Roda

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| C1 | Botão do canto: tocar abre; segurar e arrastar muda de canto (fica depois de recarregar) | #002 | |
| C2 | Todos os setores alcançáveis com o polegar, sem acertar o vizinho (48 px) | #057 | |
| C3 | Prato: anda frame a frame e segura o loop; soltar retoma | #003 | |
| C4 | Arco de velocidade, encaixe em 1× e 0×, toque duplo | #003 | |
| C5 | Desfazer/Refazer; modo histórico no prato por 3 s | #004 | |
| C6 | Pétalas por toque-toque e por arrastar-soltar | #008 | |

## D. Ferramentas

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| D1 | Pétala em dois arcos: Riscar (Pincel, Lápis, Marcador, Giz) e Mexer (Borracha, Balde, Laço) | #026 | |
| D2 | Cada pincel com pressão leve e forte; Lápis com Grão alto e baixo | #020 | |
| D3 | Tamanho por ferramenta (trocar e voltar mantém) | #020 | |
| D4 | Suavizar traço em 0 / 0,5 / 1 | #021 | |
| D5 | Balde: círculo fechado; com falha pequena; em cima da linha ("Nada para pintar") | #014 | |
| D6 | Balde com linha de outra camada (linha Preto, balde Rosa) | #014 | |
| D7 | Tempo do quadro ao usar o balde (painel): o loop engasga? ___ | #014 | |

## E. Camadas, tintas e retícula

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| E1 | Pétala Camadas: "+" até 8 camadas; ativar; desenhar em várias | #029 | |
| E2 | Toque longo: trocar tambor e cor, Visível, Travar ("Camada travada"), Subir, Descer, Duplicar, Apagar (confirma) | #029 | |
| E3 | Desfazer cada operação de camada | #028 | |
| E4 | Arco de cores troca a cor da tinta para todas as camadas dela | #029 | |
| E5 | Vermelho vivo; Falso CMYK e "Do projeto" | #034, #029 | |
| E6 | Retícula Reticulada em duas tintas: ângulos diferentes; ponto Redondo / Linha / Elipse | #030, #050 | |
| E7 | Densidade 100% / 30% / 10% / 5% nas duas retículas | #030 | |
| E8 | Lineatura 40 / 60 / 85: **moiré com os pixels em 100%?** (print) | #030 | |
| E9 | Compositor (painel) com 4 camadas ___ ms; com 8 reticuladas ___ ms; quadros/s ___ | #030, #060 | |
| E10 | Qualidade automática desce quando engasga e volta depois (painel "qualidade do riso") | #060 | |

## F. Tempo

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| F1 | Arrastar 2 dedos para os lados anda no tempo; régua aparece e some | #023 | |
| F2 | Com zoom, arrastar 2 dedos move o papel; pinça dá zoom | #019, #023 | |
| F3 | Folha Tempo: miniaturas certas; tocar vai ao frame | #036 | |
| F4 | Inserir, Duplicar, Apagar, Mover frame; desfazer | #037 | |
| F5 | Exposição ×3 num frame: fica mais tempo; o prato pula ele num passo | #038 | |
| F6 | Camadas com loops diferentes tocam juntas; "C2 · 3/8" com 5+ camadas | #031 | |
| F7 | Papel-cebola 2 antes / 2 depois; intensidade | #040 | |
| F8 | Auto voltando e parando no último frame | #041 | |

## G. Seleção

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| G1 | Laço seleciona traços e baldes; chips Duplicar → / Copiar / Apagar | #039 | |
| G2 | Mover com a caneta; girar e escalar com 2 dedos; dica de 2 dedos nas primeiras vezes | #013 | |
| G3 | Copiar numa camada, colar em outra camada e outro frame | #039 | |
| G4 | Zoom 300%: o traço cai sob a caneta; a caixa e os chips seguem o zoom | #019 | |

## H. Impressão

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| H1 | Amarelo sobre Azul × Azul sobre Amarelo (subir/descer): verdes um pouco diferentes | #048 | |
| H2 | Desalinhamento no máximo (~3 mm); com Trapping sem filete branco; sem Trapping o filete aparece | #030, #033 | |
| H3 | Marcas de rolo e Transferência (ligar/desligar) | #053 | |
| H4 | Prova de impressão: aparece a folha com nome, data e tintas; Salvar prova | #051 | |

## I. Projetos, arquivos e exportação

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| I1 | Menu → Projetos: criar 3, alternar, duplicar, apagar; recarregar e conferir | #043 | |
| I2 | Salvar arquivo `.grao` (Downloads) e Abrir arquivo | #010 | |
| I3 | Exportar GIF 50% e 100%: abre na galeria e no WhatsApp, em laço | #044 | |
| I4 | Exportar Vídeo (MP4?) com 1 e 3 voltas | #016, #046 | |
| I5 | Exportar PNGs (.zip) e abrir no PC | #045 | |
| I6 | Exportar Separações: abrir no PC; traço nítido a 100%; um arquivo por tinta | #052 | |
| I7 | Durante qualquer exportação o loop continua (salvo nas separações, que param alguns segundos) | #062 | |

## J. Sessão longa

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| J1 | 1 hora animando: o app não fica lento (quadros/s no painel) e nada se perde | #061 | |
| J2 | Fechar o Chrome no meio de um desenho e reabrir: o desenho está lá | #061 | |

## K. Pessoas

| # | Teste | Pedido | Resultado |
| --- | --- | --- | --- |
| K1 | Teste com 3 pessoas pelo roteiro do `docs/14-teste-com-pessoas.md` | #058 | |

**Números de base** para o ADR-001 e para as próximas versões: latência (B2), quadros/s desenhando, compositor com
4 e 8 camadas (E9), qualidade automática (E10).
