# Relatório da v0.3 (0.2.1 → 0.3.2): resposta ao HANDOFF

**Para:** o Claude do chat (claude.ai), na auditoria da v0.3 · **De:** o Claude do VS Code
**Data:** 24/11/2026 · **Build:** `0.3.2-b11` em https://lama-av.github.io/Grao/
**Detalhes:** respostas dos pedidos #010–#027 e #034 no `HANDOFF.md`; `CHANGELOG.md`.

> **Nota:** o Raphael pediu em 24/11 para seguir até a v1.0 sem pausas. Este relatório fecha a v0.3 como o #027
> pede, mas o trabalho continuou. O relatório geral está em `docs/relatorio-v1.0.md`.

## Resumo

| Versão | O que trouxe |
| --- | --- |
| 0.2.1 | Menu com arquivo `.grao` (Salvar/Abrir), cores à vista na pétala Tinta, setor Tempo, dica de 2 dedos |
| 0.3.0 | Balde (com paredes de outras tintas), linha reta, exportar vídeo (MP4/WebM), correções de uma revisão de código |
| 0.3.1 | Zoom e mover o papel, pincéis Lápis/Marcador/Giz, tamanho por ferramenta, suavizar traço |
| 0.3.2 | Gesto de tempo com 2 dedos e régua, filtro de palma, Menu → Gestos, pétala em dois arcos, Vermelho vivo |

Nenhuma dessas versões foi testada no tablet ainda. O que roda aqui é o teste de lógica (164 verificações na 0.3.2,
sem navegador) e a checagem de sintaxe. O desenho na tela, a GPU, o vídeo e o tato só o tablet confirma.

## O que saiu diferente dos pedidos

| Pedido | Diferença | Por quê |
| --- | --- | --- |
| #010 Menu | Desenhado pelo VS Code (o chat não tinha escrito) | O Raphael pediu para seguir sem esperar |
| #014 Balde | Paredes vêm do frame de cada outra tinta **no meio do tempo** do frame do balde | Com loops de tamanhos diferentes, é o jeito determinístico de saber "qual frame da outra tinta" |
| #016 Vídeo | Sem GIF; MOV impossível no navegador | GIF precisa de codificador próprio (feito na 0.6) |
| #021 Suavizar | Um ajuste para todos os pincéis (o plano dizia "por pincel") | Mais simples |
| #022 Gestos | Pinça decidida comparando a mudança de distância com o deslocamento do meio | Com eventos chegando um dedo de cada vez, "distância mudou 10%" confundia arrastar com pinça |
| #024 Palma | "Pairando" vale por até 1 s sem eventos da caneta | Se o Android não mandar `pointerleave`, a palma ficaria filtrada para sempre |
| #018 Revisão | `willReadFrequently` mantido | O balde lê pixels; e evita a leitura da GPU que a v0.1 acusava. Medir no tablet |

## Roteiro de teste no tablet (v0.3.2)

Marque **ok** ou descreva o **problema**. Se possível, um print ou vídeo curto.

| # | Teste | Resultado |
| --- | --- | --- |
| 1 | **Menu:** dar nome, Salvar arquivo, achar o `.grao` em Downloads; Novo projeto; Abrir arquivo (o desenho volta) | |
| 2 | **Cores à vista:** pétala Tinta mostra as 4 tintas e as 9 cores; tocar numa cor troca a tinta ativa | |
| 3 | **Balde:** círculo fechado; círculo com falha pequena; linha em Preto e balde em Rosa; mover o círculo com o laço | |
| 4 | **Linha reta:** parar 0,5 s antes de soltar; mover a ponta; desenhar devagar sem querer linha | |
| 5 | **Vídeo:** exportar um loop de 1 s (deve dar 3 s), conferir se é MP4 e abre na galeria | |
| 6 | **Zoom:** pinça até ~300%, desenhar detalhes (o traço cai sob a caneta), arrastar, voltar a 100% | |
| 7 | **Pincéis:** os 4 com pressão leve e forte; Lápis com Grão alto e baixo; Suavizar em 0 / 0,5 / 1 | |
| 8 | **Gesto de tempo:** 2 dedos para os lados (régua aparece, anda frame a frame); com zoom move o papel | |
| 9 | **Palma:** desenhar 2 min com a palma apoiada: nenhum zoom, desfazer ou passo de tempo por acidente | |
| 10 | **Painel Teste da Fase 0:** quadros/s desenhando ___; compositor ___ ms; tempo do quadro ao usar o balde ___; toques ignorados ___; tamanho do último toque ___ | |
| 11 | **Vermelho vivo** e a combinação Azul + Vermelho vivo + Amarelo + Preto | |
| 12 | **Latência:** filmar em câmera lenta (240 fps) o `teste-caneta.html`, contar os quadros entre a ponta e o traço: ___ quadros = ___ ms. **Decide o ADR-001** | |

**Números de base** (preencher no item 10 e 12, para comparar com a v0.4): quadros/s, compositor (ms), latência (ms).
