# 12 · Tintas riso: cores e valores

Pesquisa de 24/11/2026, pedida pelo Raphael. **Fonte principal: [Stencil Wiki, Category:Riso inks](https://stencil.wiki/wiki/Category:Riso_inks)**
(versão de 2 de julho de 2026), que lista as tintas fabricadas oficialmente pela Riso, separadas em **Padrão (19)**,
**Edição especial (53)** e **Sob encomenda (9)**: 81 tintas no total. A página também lista "Honey", fora dessas
seções e sem valores.

## O que é "oficial" e o que é aproximação

- A **Riso Kagaku** publica as tintas por nome e código de cartucho (ex.: Blue = S-4257 / S-4388). Ela **não
  publica hex**: tinta riso é de soja, semitransparente, e a cor final depende do papel e da densidade.
- O hex, o RGB e o CMYK da Stencil Wiki são a referência da comunidade para **tela**, não uma medida da tinta.
- A página de categoria não mostra Pantone nem código de cartucho; as páginas de cada tinta mostram (ex.: Blue =
  Pantone 3005 U). Na tabela, a coluna Pantone vem do pacote riso-colors (raspado da wiki em 2019), só como
  referência.
- A **versão anterior deste doc usava o riso-colors** (npm, MIT, 2019). Ele está desatualizado: 5 cores mudaram
  de valor e 3 tintas novas têm valores (marcadas abaixo), além de Honey, ainda sem valores.

**Para o Grão:** as 8 tintas de `src/config.js` são todas da linha **Padrão** e têm exatamente os valores atuais
da wiki. Nada a trocar.

## Padrão (19)

| Nome | Hex (wiki) | Pantone U (riso-colors 2019) | Mudou desde 2019? | No Grão |
| --- | --- | --- | --- | --- |
| Black | `#000000` | BLACK U |  | Preto |
| Blue | `#0078BF` | 3005 U |  | Azul |
| Bright Red | `#F15060` | 185 U |  |  |
| Brown | `#925F52` | 7526 U |  |  |
| Burgundy | `#914E72` | 235 U |  |  |
| Flat Gold | `#BB8B41` | 1245 U |  |  |
| Fluorescent Pink | `#FF48B0` | 806 U |  | Rosa flúor |
| Green | `#00A95C` | 354 U |  | Verde |
| Hunter Green | `#407060` | 342 U |  |  |
| Light Gray | `#88898A` | 424 U |  |  |
| Marine Red | `#D2515E` | 186 U |  |  |
| Medium Blue | `#3255A4` | 286 U |  |  |
| Orange | `#FF6C2F` | ORANGE 021 U |  | Laranja |
| Purple | `#765BA7` | 2685 U |  |  |
| Red | `#FF665E` | WARM RED U |  |  |
| Riso-Federal Blue | `#3D5588` | 288 U |  | Azul federal |
| Teal | `#00838A` | 321 U |  | Teal |
| Violet | `#9D7AD2` | 265 U |  |  |
| Yellow | `#FFE800` | YELLOW U |  | Amarelo |

## Edição especial (53)

| Nome | Hex (wiki) | Pantone U (riso-colors 2019) | Mudou desde 2019? | No Grão |
| --- | --- | --- | --- | --- |
| Apricot | `#F6A04D` | 143 U |  |  |
| Bisque | `#F2CDCF` | 503 U |  |  |
| Brick | `#A75154` | 1807 U |  |  |
| Bright Gold | `#BA8032` | 131 U |  |  |
| Bright Olive Green | `#B49F29` | 103 U |  |  |
| Bubblegum | `#F984CA` | 231 U |  |  |
| Charcoal | `#70747C` | 7540 U |  |  |
| Copper | `#BD6439` | 1525 U |  |  |
| Cornflower | `#62A8E5` | 292 U |  |  |
| Cranberry | `#BA0C24` | 214 U | sim (era `#D1517A`) |  |
| Crimson | `#E45D50` | 485 U |  |  |
| Dark Mauve | `#BD8CA6` | 687 U |  |  |
| Emerald | `#19975D` | 355 U |  |  |
| Fluorescent Orange | `#FF7477` | 805 U |  |  |
| Forest | `#516E5A` | 357 U |  |  |
| Granite | `#A5AAA8` | 7538 U |  |  |
| Grape | `#6C5D80` | 2695 U |  |  |
| Grass | `#397E58` | 356 U |  |  |
| Gray | `#928D88` | 403 U |  |  |
| Indigo | `#484D7A` | 2758 U |  |  |
| Ivy | `#169B62` | 347 U |  |  |
| Kelly Green | `#67B346` | 368 U |  |  |
| Lagoon | `#2F6165` | 323 U | a wiki mostra hex `#2F6F65`, mas o RGB dela (47, 97, 101) dá `#2F6165`; usamos o RGB |  |
| Lake | `#235BA8` | 293 U |  |  |
| Light Lime | `#E3ED55` | 387 U |  |  |
| Light Mauve | `#E6B5C9` | 7430 U |  |  |
| Light Teal | `#009DA5` | 320 U |  |  |
| Mahogany | `#8E595A` | 491 U |  |  |
| Maroon | `#9E4C6E` | 221 U |  |  |
| Melon | `#FFAE3B` | 1235 U |  |  |
| Metallic Gold | `#AC936E` | 872 U |  |  |
| Midnight | `#435060` | 296 U |  |  |
| Mist | `#B8C7C4` | 7485 U | sim (era `#D5E4C0`) |  |
| Moss | `#68724D` | 371 U |  |  |
| Orchid | `#BB76CF` | 2592 U | sim (era `#AA60BF`) |  |
| Paprika | `#EE7F4B` | 158 U |  |  |
| Pine | `#237E74` | 3295 U |  |  |
| Plum | `#845991` | 2603 U |  |  |
| Pumpkin | `#FF6F4C` | 1655 U |  |  |
| Raisin | `#775D7A` | 519 U |  |  |
| Raspberry Red | `#B44B65` | 214U | sim (era `#D1517A`) |  |
| Scarlet | `#F65058` | RED 032 U |  |  |
| Sea Blue | `#0074A2` | 307 U |  |  |
| Sea Foam | `#62C2B1` | 570 U |  |  |
| Sky Blue | `#4982CF` | 285U |  |  |
| Slate | `#5E695E` | 5605 U |  |  |
| Smoky Teal | `#5F8289` | 5483 U |  |  |
| Spruce | `#4A635D` | 567 U |  |  |
| Steel | `#375E77` | 302 U |  |  |
| Sunflower | `#FFB511` | 116 U |  |  |
| Tomato | `#D2515E` | 186 U |  |  |
| Turquoise | `#00AA93` | 3275 U |  |  |
| Wine | `#914E72` | 235 U |  |  |

## Sob encomenda (9)

| Nome | Hex (wiki) | Pantone U (riso-colors 2019) | Mudou desde 2019? | No Grão |
| --- | --- | --- | --- | --- |
| Aqua | `#5EC8E5` | 637 U |  |  |
| Citron | `#FAF3B7` | — | nova na lista |  |
| Clear Medium | `#F2F2F2` | — | nova na lista; base transparente, sem cor (a wiki só dá RGB 242, 242, 242) |  |
| Coral | `#FF8E91` | — | nova na lista |  |
| Fluorescent Green | `#44D62C` | 802 U |  |  |
| Fluorescent Red | `#FF4C65` | 812 U |  |  |
| Fluorescent Yellow | `#F7FF00` | 803 U | sim (era `#FFE900`) |  |
| Mint | `#82D8D5` | 324 U |  |  |
| White | `#FFFFFF` | — |  |  |

Alguns nomes diferentes têm o mesmo hex (Tomato = Marine Red, Wine = Burgundy): são cartuchos diferentes com a mesma
cor de referência.

## Fontes

- Stencil Wiki, Category:Riso inks: https://stencil.wiki/wiki/Category:Riso_inks
- Stencil Wiki, Blue (exemplo de página de tinta com Pantone e código): https://stencil.wiki/wiki/Blue
- riso-colors 1.0.1 (npm, MIT, 2019; só para a coluna Pantone): https://www.npmjs.com/package/riso-colors
