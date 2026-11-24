# 13 — Conselho de design sobre a v0.3.1 e decisões até a v1.0

Data: 24/11/2026. Revisão da v0.3.1 pelas cinco lentes do conselho (Ive, Rams, Hadid, Ingels, Norman) e as
decisões que saíram dela. Este documento **substitui a ordem de versões do doc 10** daqui para a frente. Os
princípios e a especificação da roda no doc 10 continuam valendo.

## Nota da v0.3.1

| Lente | Nota | Comentário |
| --- | --- | --- |
| Ive — material | 4/5 | O papel ocupa a tela e o riso é o material de verdade (grão, ferver, papel com fibra). Falta a retícula, o segundo material da riso. |
| Rams — economia | 3/5 | A pétala Ferramenta já tem 7 ferramentas numa fila só. Quatro versões seguidas sem teste no tablet: escopo crescendo mais rápido que a verificação. |
| Hadid — fluxo | 4/5 | Desenhar → girar o prato → desenhar é fluido. Mas ir ao canto para andar no tempo quebra o gesto quando a roda está recolhida. |
| Ingels — prazer | 4/5 | Balde que respeita linhas de outra tinta e o lápis feito de grão são achados ótimos. |
| Norman — clareza | 2/5 | Os gestos de 2 dedos (desfazer, girar a seleção, zoom) são invisíveis. Ninguém descobre sozinho. |

## O que cada lente disse

**Ive.** A riso tem dois materiais: a **tinta** e a **retícula**, que é o jeito como a máquina transforma um tom em
pontos. A riso de verdade trabalha com dois tipos: **estocástica** (pontos espalhados ao acaso, o "grão" que o
Grão já tem) e **reticulada** (pontos em grade, com ângulo e lineatura). Se o app só tem a estocástica, metade do
material está faltando. A retícula precisa ser uma escolha **por camada**, como na gráfica.

**Rams.** Parar e medir. Nenhum recurso novo antes de testar no tablet o que já existe. E organizar a pétala
Ferramenta em dois grupos: o que **risca** (Pincel, Lápis, Marcador, Giz) e o que **mexe** (Borracha, Balde,
Laço). Sete itens soltos são uma lista; dois grupos são uma ferramenta.

**Hadid.** O tempo deveria estar onde as mãos já estão. O gesto pedido pelo Raphael (**arrastar 2 dedos para os
lados anda no tempo**) traz o prato da roda para o papel inteiro. E a linha do tempo deve **aparecer com o gesto**:
enquanto os dedos andam, surge uma régua de frames na borda; ao soltar, ela some. Mais tarde, essa mesma régua vira
a tira de frames editável (v0.5).

**Ingels.** A restrição da gráfica é o charme: 4 tintas por projeto, como 4 tambores da máquina. As camadas
(até 8) imprimem com um desses 4 tambores. A retícula reticulada com ângulo diferente por tinta cria o moiré
de verdade, o que é um defeito virando estética.

**Norman.** Gesto sem pista não existe. Precisa de três coisas:
1. Uma pista **na hora**: a régua aparece ao arrastar, e a leitura mostra "3/8".
2. Um lugar para consultar: o item **Gestos** no Menu, com os 4 gestos de 2 dedos.
3. Segurança: a palma não pode virar gesto. Toques que chegam enquanto a caneta está na tela ou pairando
   (ou logo depois) são ignorados. Toques muito largos também.

## Tensões e como foram resolvidas

- **Hadid × Norman: arrastar 2 dedos para os lados é tempo ou é mover o papel?** Os dois usam o mesmo
  movimento. Resolução: o próprio papel mostra qual vale.
  - **Papel inteiro na tela (100%):** não há para onde mover o papel, então arrastar = **tempo**.
  - **Com zoom:** arrastar = **mover o papel** (como em todo app de desenho). Para andar no tempo com zoom: o
    prato da roda, ou uma pinça para fora até o papel encaixar em 100%.
  - **Pinça (os dedos abrem ou fecham)** = zoom, sempre.
  O estado não fica escondido: o zoom está à vista no próprio desenho e na leitura "200%" da roda. Isso respeita
  a decisão 1 do `CLAUDE.md`.
- **Rams × Ingels: retícula é decoração?** Não: é o jeito físico de a riso fazer tons. Entra como **um** controle
  por camada (tipo + densidade), sem painel de pré-impressão.
- **Ingels × Rams: mais ferramentas?** Não. A v0.4 não ganha ferramenta nova; ganha camadas e retícula.

## Decisões

1. **Gesto de tempo com 2 dedos** (v0.3.2): arrastar 2 dedos na horizontal com o papel em 100% anda frame a frame
   (48 px = 1 frame, direita = para frente). Segura o loop enquanto os dedos estão na tela, como o prato. Soltar
   retoma. Uma régua de frames aparece na borda de baixo durante o gesto. Arquitetura no ADR-003.
2. **Palma não vira gesto** (v0.3.2): toques ignorados com a caneta encostada, pairando ou até 300 ms depois, e
   toques com área de contato larga.
3. **Item "Gestos" no Menu** (v0.3.2): os 4 gestos de 2 dedos, com uma frase cada.
4. **Pétala Ferramenta em dois arcos** (v0.3.2): Riscar (Pincel, Lápis, Marcador, Giz) e Mexer (Borracha, Balde,
   Laço). O arco de tamanho continua.
5. **Pausa obrigatória depois da v0.3.2**: o VS Code para e espera o teste no tablet. Nada da v0.4 começa antes.
6. **Camadas** (v0.4): até 8 camadas; o projeto tem 4 **tintas** (tambores); cada camada imprime com uma delas.
   O setor **Tinta** vira **Camadas**.
7. **Retícula por camada** (v0.4): tipo **Estocástica** (padrão, o grão atual) ou **Reticulada** (pontos em grade);
   densidade de 10 a 100%. Na reticulada, cada tinta tem um ângulo próprio (padrão 15°, 75°, 0°, 45°) e a
   lineatura é do projeto. Formas de ponto (linha, elipse) e controles finos ficam para a v0.7.
8. **Tempo** (v0.5): a régua da decisão 1 vira tira de frames com miniaturas, editável na folha Tempo.
9. **Ordem até a v1.0**: 0.3.2 Gestos e auditoria → 0.4 Camadas e retícula → 0.5 Tempo → 0.6 Projetos, GIF e
   sem internet → 0.7 Riso completo e separações → 0.8 Primeira vez e acessibilidade → 0.9 Beta → 1.0.
10. **Divisão do trabalho**: o chat escreve os pedidos detalhados de cada versão **depois** da auditoria da
    anterior. O `HANDOFF.md` traz agora os pedidos da 0.3.2 e da 0.4; as outras versões aparecem como roteiro.

## Referência técnica: Secret Riso Club, "Riso Basics" (24/11)

Fonte trazida pelo Raphael: https://secretrisoclub.com/Riso-Basics. O que confirma e o que muda:
- **Confirma o modelo de tambores:** cada cor tem uma matriz própria num tambor; para outra cor, troca o tambor
  e passa o papel de novo. Sobreimpressão = nova passada. Por isso: 4 tintas por projeto, camadas imprimem com
  uma delas (decisão 6).
- **Desalinhamento cresce com as passadas:** mais de duas camadas pedem mais passadas e mais desalinhamento.
  Entra na v0.7 (desalinhamento proporcional à ordem de impressão).
- **Arquivos para a gráfica:** um arquivo em escala de cinza por cor, preto de 5% a 100%. Por isso a densidade
  da retícula vai de **5%** (não 10%) a 100% (#030), e a v0.7 exporta separações nesse formato.
- **Áreas cheias acima de 50% imprimem irregulares** (cobertura desigual, variação de tom, marcas). O app imita
  isso na retícula estocástica (#030). A Prensa, no futuro, pode avisar antes de mandar imprimir.
- **Imperfeições:** borrão, transferência de tinta entre folhas, marcas de rolo em folhas muito carregadas.
  Viram imperfeições opcionais na v0.7, desligadas por padrão.
- **Não muda o Grão:** tamanho de papel, margem sem sangria e gramatura são assunto da Prensa.
- A página não fala de tipos de retícula nem de lineatura; os valores do #030 (40/60/85) seguem como estão.

## Referência técnica: Risotrip, "Impressão" (24/11)

Fonte trazida pelo Raphael: https://risotrip.co/Impressao.
- **Confirma os dois tipos de retícula:** convencional (AM), pontos com espaço igual e tamanho variável; e
  estocástica (FM/granulada), pontos de mesmo tamanho e espaço variável. A gráfica escolhe por projeto; o arquivo
  não leva retícula (o driver da riso gera). No Grão, a escolha é por camada (#030).
- **Densidade:** a riso trabalha mal entre 0 e 10%; degradês entre 10% e 90%; áreas cheias até 85% (evita marcas
  de rolo e de agulha e transferência); preto até 96%. O #030 imita a falha abaixo de 10% e a irregularidade das
  áreas cheias, que cresce de 50% até forte acima de 85%.
- **Desalinhamento aceitável: 2 a 3 mm.** O controle do Grão passa a ir até 3 mm num A4 (#030).
- **Trapping:** uma cor invade um pouco a vizinha para não aparecer filete branco. Vira o #033 (balde avança
  0,5 mm por baixo da linha, ligado por padrão).
- **Tintas são próprias da Riso** (sem sistema padrão); HEX e Pantone são aproximações para simulação. Confere com
  o doc 12. As 8 tintas do Grão continuam (decisão do Raphael).
- **"Falso CMYK"** (Azul, Vermelho Vivo, Amarelo, Preto): possível predefinição de 4 tintas no futuro; exigiria a
  tinta Vermelho Vivo, que não está nas 8. **Pergunta aberta para o Raphael.**
- **Fica para a Prensa:** PDF em escala de cinza por cor a 300 dpi com o nome da cor no arquivo, papéis não
  revestidos de 80 a 210 g, A3 com 1 cm de margem, sangria de 3 mm, tamanhos mínimos de texto e linha.
  As separações da v0.7 do Grão já seguem o formato "um arquivo cinza por cor, com o nome da cor".

## Segunda revisão do conselho: os passos a seguir (24/11)

Revisão do roteiro 0.3.2 → 1.0 depois das duas fontes técnicas de riso e do pedido do Vermelho vivo.

| Lente | Nota do roteiro | Comentário |
| --- | --- | --- |
| Ive — material | 4/5 | Retícula AM e FM, trapping e densidade realista deixam o riso honesto. Risco: retícula fina demais vira moiré com os pixels da tela. |
| Rams — economia | 4/5 | A pausa depois da 0.3.2 segura o escopo. A paleta precisa de um limite escrito: fecha em 9. |
| Hadid — fluxo | 4/5 | O gesto de tempo leva o prato para o papel inteiro. A tira de frames da v0.5 continua o mesmo movimento. |
| Ingels — prazer | 5/5 | Falso CMYK com 4 tambores é a restrição da gráfica virando brinquedo: a pessoa descobre o verde do azul sobre o amarelo. |
| Norman — clareza | 3/5 | A pergunta mais antiga do projeto continua sem resposta: **a latência do traço nunca foi medida.** |

**O que cada lente pediu e virou decisão:**
- **Rams: a paleta fecha em 9 tintas.** Vermelho vivo entra (#034) porque completa o falso CMYK. Nenhuma outra
  cor sem uma razão de impressão como essa.
- **Ingels: "Tintas prontas" com Falso CMYK** na v0.4 (#029). Um toque troca as 4 tintas; os desenhos ficam.
- **Norman: a auditoria da 0.3.2 decide o ADR-001.** O ADR está "Proposto" desde a v0.1 e a v0.4 vai pesar mais
  na GPU (8 camadas, retícula). Antes de construir mais em cima da web, medir: vídeo em câmera lenta do traço e
  números de desempenho de hoje (#027, itens 11 e 12). Se a latência passar de 50 ms ou o tablet não segurar
  60 quadros/s, a conversa sobre nativo volta antes da v0.4.
- **Ive: retícula sem moiré de pixel** (#030). A 60 lpi, cada ponto tem ~3 px da tela. O shader suaviza a borda
  do ponto; se ainda houver moiré, o VS Code registra em Dúvidas com print, para o chat decidir.
- **Rams + Norman: abrir sem internet sobe da v0.6 para a v0.4** (#035). O app já mora no tablet pelo GitHub
  Pages; um caderno que não abre sem Wi-Fi não é caderno.
- **Hadid: a v0.5 começa da régua.** A régua do gesto (#023) e a folha Tempo viram a mesma tira de frames.
- **Ingels: o fim da v0.7 é a "Prova de impressão".** É o momento de pico: a animação vira uma folha riso parada,
  em alta resolução, com as imperfeições. Pensar nela como ritual de fechamento, não como botão de exportar.

**Tensão que fica em aberto (para depois da auditoria):** camadas (v0.4) antes de tempo (v0.5)? Para um caderno
de animação, inserir, apagar e mover frames é mais central que camadas. A ordem se mantém porque o Raphael pediu
camadas e retícula primeiro, mas o resultado do teste pode inverter as duas.

**Ordem final:** 0.3.2 gestos + Vermelho vivo → ⏸ teste, latência e ADR-001 → 0.4 camadas, retícula, Falso CMYK,
sem internet → 0.5 tempo → 0.6 projetos e GIF → 0.7 riso completo e Prova → 0.8 primeira vez → 0.9 beta → 1.0.
