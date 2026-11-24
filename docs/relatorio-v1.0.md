# Relatório da rodada 0.3.2 → 1.0.0-rc.1

**Para:** o Raphael (revisão) e o Claude do chat (auditoria) · **De:** o Claude do VS Code
**Data:** 24/11/2026 · **Build:** `1.0.0-rc.1-b18` em https://lama-av.github.io/Grao/
**Pedido do Raphael:** "execute os pedidos até a versão 1.0, sem pausas, faça um relatório detalhado e uma lista de
testes". **Lista de testes:** [`docs/15-lista-de-testes.md`](15-lista-de-testes.md).

## 1. Resumo em 5 linhas

1. Saíram 8 versões publicadas e com tag no GitHub (0.3.2, 0.4.0, 0.5.0, 0.6.0, 0.7.0, 0.8.0, 0.9.0 e 1.0.0-rc.1),
   cada uma com CHANGELOG, documento `.docx` e respostas no `HANDOFF.md` (pedidos #022 a #064).
2. **Nada disso foi testado no tablet.** A verificação automática que roda aqui é o teste de lógica: 265
   verificações sem navegador, mais a checagem de sintaxe de todos os módulos e uma checagem estática do shader.
3. O shader do compositor cresceu muito (camadas, retícula, sobreimpressão, separações) e **não pôde ser compilado
   aqui**: o validador da Khronos foi bloqueado pelas permissões. Ele foi revisado à mão contra as regras do GLSL ES
   3.00. É o maior risco: se falhar, o app abre com a caixa vermelha "Shader: …".
4. Duas revisões de código automáticas (na 0.3.0 e na 0.9) encontraram 20 problemas; 18 foram corrigidos e 2 ficaram
   como limitação registrada.
5. A versão se chama **candidata a 1.0** porque os critérios da 1.0 no doc 10 (metas de desempenho no tablet,
   nenhum P1/P2 aberto, teste com pessoas) só podem ser verificados com o tablet e com gente.

## 2. O que cada versão trouxe

| Versão | Tema | Destaques | Pedidos |
| --- | --- | --- | --- |
| 0.3.2 | Gestos | Arrastar 2 dedos anda no tempo (régua), filtro de palma, Menu → Gestos, pétala Riscar/Mexer, Vermelho vivo | #022–#027, #034 |
| 0.4.0 | Camadas | 4 tintas + até 8 camadas, pétala Camadas, folha da camada, retícula estocástica/reticulada, trapping, Falso CMYK, abrir sem internet | #028–#033, #035 |
| 0.5.0 | Tempo | Tira de frames com miniaturas, inserir/duplicar/apagar/mover frame, exposição ×1–×4, copiar/colar, papel-cebola e Auto configuráveis | #036–#042 |
| 0.6.0 | Projetos | Galeria no aparelho, GIF (codificador próprio), PNGs em .zip, folha Exportar (escala, voltas) | #043–#047 |
| 0.7.0 | Riso completo | Sobreimpressão por passada, desalinhamento por passada, pontos linha/elipse, Prova de impressão, separações 300 dpi, imperfeições | #048–#054 |
| 0.8.0 | Primeira vez | Projeto de boas-vindas com 3 dicas, roda com alvos de 48 px, leitor de tela, textos revisados, roteiro do teste com pessoas | #055–#059 |
| 0.9.0 | Beta | Qualidade automática, salvar ao sair, armazenamento persistente, 10 correções de revisão | #060–#063 |
| 1.0.0-rc.1 | Fechamento | README e instruções reescritos, créditos conferidos, relatório e lista de testes | #064 |

Detalhe de cada pedido, com "o que testar": `HANDOFF.md`. Linha a linha: `CHANGELOG.md`.

## 3. Quem decidiu o quê

- **0.3.2 e 0.4.0:** pedidos escritos pelo chat (`HANDOFF.md`). A ordem dizia para **parar** depois da 0.3.2 e
  esperar a auditoria; a pausa foi pulada porque o Raphael pediu "sem pausas".
- **0.5 em diante:** o chat ainda não tinha escrito os pedidos. Escrevi a partir do roteiro do doc 13 (e das tarefas
  T-0xx do doc 10), registrando cada decisão no `HANDOFF.md`, na seção "Pedidos escritos pelo VS Code". **O chat pode
  rever qualquer uma.**

## 4. Decisões de design tomadas pelo VS Code (para o chat revisar)

| Assunto | Decisão | Alternativa possível |
| --- | --- | --- |
| Pinça × arrastar (#022) | Pinça = a distância mudou ≥ 10% **e** mais que metade do quanto o meio dos dedos andou | Só "≥ 10%" (o ADR), que confundia arrastar com pinça no teste |
| Palma "pairando" (#024) | Vale por até 1 s sem eventos da caneta | Até sair de vez (risco de travar se o Android não avisar) |
| Apagar a última camada | Bloqueado | Deixar o projeto sem camada |
| Cores na pétala Camadas | Arco das 9 cores continua por fora | Só na folha da camada |
| Estocástica com densidade | A densidade remove "cachos" de tinta | Pontos isolados |
| Exposição (#038) | `layer.expo`, 1 a 4 tempos por frame | Frames repetidos |
| Apagar frame com desenho | Sem confirmação (tem desfazer) | Confirmar |
| Colar (#039) | Chip "Colar" no alto, com loop parado | Item no Menu |
| Galeria (#043) | Novo projeto não pede confirmação (o atual fica guardado) | Manter a confirmação |
| GIF (#044) | Paleta por quadro, FPS 24 quando as camadas têm FPS diferentes | Paleta global, pontilhado |
| Sobreimpressão (#048) | Ordem = ordem das camadas; cobertura por tinta a olho | Ordem editável |
| Separações (#052) | 300 dpi; 600 dpi fora (limite de textura) | — |
| Boas-vindas (#055) | Bola quicando gerada por código | Arquivo de exemplo |
| Qualidade (#060) | Pelo intervalo entre quadros (21 ms desce, 17,5 ms sobe) | Pelo tempo da GPU (precisa de extensão) |

## 5. Arquitetura nova

- **ADR-003** (do chat): gestos de 2 dedos numa máquina de estados pura (`src/input/gestures.js`).
- **ADR-004** (VS Code): camadas separadas das tintas, máscaras pelo **id fixo da camada**, retícula no compositor.
- Módulos novos:
  - `src/actions.js`, `src/schedule.js` (limite de ~8 ms por quadro), `src/view.js` (zoom);
  - `src/quality.js`, `src/doc/welcome.js`;
  - `src/render/fill.js` (balde), `src/render/thumb.js`;
  - `src/io/file.js`, `src/io/video.js`, `src/io/gif.js`, `src/io/zip.js`;
  - `sw.js` (abrir sem internet).
- Arquivo `.grao` **versão 2** (tintas + camadas com id). O `sanitize` migra a versão 1 sem mudança visual e confere
  cada campo (traço estragado sai; valores fora da faixa voltam ao padrão).

## 6. Como foi verificado aqui

| Verificação | Resultado | Limite |
| --- | --- | --- |
| `tests/logic_test.mjs` (Node do VS Code, DOM de mentira) | **265 verificações passando** | Testa regras: caneta, gestos, palma, roda, camadas, desfazer, balde, GIF/LZW, ZIP, exposição, galeria (uid), qualidade, service worker. **Não desenha nem usa GPU** |
| Testes de mutação (quebrar o código de propósito) | 4 pontos críticos conferidos (botão 32, transformação interrompida, cancelamento da caneta, máscaras) | Só onde foi feito |
| Sintaxe de todos os módulos (`--check`) | Sem erro | — |
| Checagem estática do shader | Uniforms declarados, chaves fechadas, ≤ 16 texturas | **Não é compilação** |
| `tests/smoke_test.py` (Playwright + GPU) | **Não rodou** (sem Playwright aqui) | Também está desatualizado desde a 0.6 (Menu mudou) |
| Revisões de código automáticas | 0.3.0: 9 de 10 corrigidos; 0.9: 9 de 10 corrigidos | Revisão lê o código, não roda no tablet |

## 7. Riscos, do maior para o menor

1. **Shader não compilado** (todas as versões desde a 0.4). Sinal: caixa vermelha "Shader: …" ao abrir.
2. **Desempenho com 8 camadas reticuladas** no Mali-G57 (meta ≤ 8 ms). A qualidade automática ajuda, mas não
   substitui medir (lista E9–E10).
3. **Latência do traço** nunca medida (lista B2). Decide o ADR-001 (web × nativo).
4. **Moiré da reticulada** com os pixels da tela em 100% (lista E8).
5. **Separações congelam o loop** alguns segundos por tinta (limitação aceita; exportação pedida, com aviso).
6. **Valores "a olho"** (cobertura das tintas, marcas de rolo, limites de gesto e palma) precisam do olho e da mão no
   tablet.
7. **Botão 2 da caneta**: o código aceita 4 e 32; o valor real deste tablet ainda não foi medido (`teste-caneta.html`).

## 8. Critérios da 1.0 (doc 10)

| Critério | Situação |
| --- | --- |
| Metas de desempenho do `CLAUDE.md` cumpridas no tablet | **A medir** (lista B2, E9, E10) |
| Nenhum bug P1 ou P2 aberto | Nenhum conhecido; **depende do teste no tablet** |
| Documentação e docx da 1.0; créditos e licenças conferidos | **Feito** (docx `1.0.0-rc.1`; créditos no README) |
| Decidido onde publicar | Link web (PWA) no GitHub Pages; Play Store fica para depois do ADR-001 |
| Teste com 3 pessoas (v0.8) | **Roteiro pronto** (`docs/14`), teste a fazer |
| Sessão de 1 hora (v0.9) | **A fazer** (lista J1) |

**Para virar 1.0.0:** passar pela lista de testes, corrigir o que for P1/P2, medir latência e desempenho, fazer o
teste com 3 pessoas. Daí a versão sobe de `1.0.0-rc.1` para `1.0.0` sem mudança de código, se nada aparecer.

## 9. O que ficou de fora (de propósito ou por limite)

- Rótulo por setor da roda para leitor de tela (a roda é desenho em canvas; as leituras vão para `aria-live`).
- Separações a 600 dpi; lineatura por camada; ângulo editável da retícula.
- Worker para as separações (evitaria o congelamento).
- Inércia no gesto de tempo (o pedido dizia para não ter).
- Palco, Prensa, MIDI (outros produtos / 1.1).
