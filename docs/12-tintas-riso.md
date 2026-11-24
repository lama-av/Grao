# 12 · Tintas riso: cores e valores

Pesquisa de 24/11/2026, pedida pelo Raphael ("pigmentos oficiais da riso e seus valores tonais exatos").

## O que existe de "oficial"

- A **Riso Kagaku** (fabricante) publica as tintas por **nome e código do cartucho** (ex.: S-4287, Fluorescent
  Pink). Ela **não publica hex nem RGB**: tinta riso é à base de soja, semitransparente, e a cor final depende
  do papel, da densidade e da máquina.
- A referência usada no mundo todo é a **equivalência Pantone Uncoated (U)** que estúdios e a comunidade
  levantaram (Stencil Wiki, guias da SAIC, UT Austin). O **hex** vem dessa Pantone U, então é uma
  **aproximação de tela**, não um valor medido da tinta.
- Fontes discordam em algumas cores (ex.: "Medium Blue" aparece como 286 U `#3255A4` num guia e como
  outro tom em outro). Para impressão de verdade, conferir com uma amostra física.

**Conclusão para o Grão:** as 8 tintas de `src/config.js` já usam exatamente os valores da lista
riso-colors (MIT, de Matt DesLauriers, raspada da Stencil Wiki). Não há valor "mais exato" público para trocar.
O que dá para melhorar é **quantas** tintas oferecemos (abaixo, 78 da lista) e a **simulação** da tinta no motor
riso (transparência, densidade, papel), que já é o plano da v0.7.

Algumas linhas repetem o mesmo hex com nomes diferentes (Tomato = Marine Red, Raspberry Red = Cranberry,
Wine = Burgundy): são cartuchos diferentes com a mesma Pantone de referência.

## Lista completa (riso-colors 1.0.1, 78 cores)

| Nome (inglês, como no cartucho) | Hex (aprox.) | Pantone U | No Grão hoje |
| --- | --- | --- | --- |
| Black | `#000000` | BLACK U | Preto |
| Burgundy | `#914E72` | 235 U |  |
| Blue | `#0078BF` | 3005 U | Azul |
| Green | `#00A95C` | 354 U | Verde |
| Medium Blue | `#3255A4` | 286 U |  |
| Bright Red | `#F15060` | 185 U |  |
| RisoFederal Blue | `#3D5588` | 288 U | Azul federal |
| Purple | `#765BA7` | 2685 U |  |
| Teal | `#00838A` | 321 U | Teal |
| Flat Gold | `#BB8B41` | 1245 U |  |
| Hunter Green | `#407060` | 342 U |  |
| Red | `#FF665E` | WARM RED U |  |
| Brown | `#925F52` | 7526 U |  |
| Yellow | `#FFE800` | YELLOW U | Amarelo |
| Marine Red | `#D2515E` | 186 U |  |
| Orange | `#FF6C2F` | ORANGE 021 U | Laranja |
| Fluorescent Pink | `#FF48B0` | 806 U | Rosa flúor |
| Light Gray | `#88898A` | 424 U |  |
| Metallic Gold | `#AC936E` | 872 U |  |
| Crimson | `#E45D50` | 485 U |  |
| Fluorescent Orange | `#FF7477` | 805 U |  |
| Cornflower | `#62A8E5` | 292 U |  |
| Sky Blue | `#4982CF` | 285U |  |
| Sea Blue | `#0074A2` | 307 U |  |
| Lake | `#235BA8` | 293 U |  |
| Indigo | `#484D7A` | 2758 U |  |
| Midnight | `#435060` | 296 U |  |
| Mist | `#D5E4C0` | 7485 U |  |
| Granite | `#A5AAA8` | 7538 U |  |
| Charcoal | `#70747C` | 7540 U |  |
| Smoky Teal | `#5F8289` | 5483 U |  |
| Steel | `#375E77` | 302 U |  |
| Slate | `#5E695E` | 5605 U |  |
| Turquoise | `#00AA93` | 3275 U |  |
| Emerald | `#19975D` | 355 U |  |
| Grass | `#397E58` | 356 U |  |
| Forest | `#516E5A` | 357 U |  |
| Spruce | `#4A635D` | 567 U |  |
| Moss | `#68724D` | 371 U |  |
| Sea Foam | `#62C2B1` | 570 U |  |
| Kelly Green | `#67B346` | 368 U |  |
| Light Teal | `#009DA5` | 320 U |  |
| Ivy | `#169B62` | 347 U |  |
| Pine | `#237E74` | 3295 U |  |
| Lagoon | `#2F6165` | 323 U |  |
| Violet | `#9D7AD2` | 265 U |  |
| Orchid | `#AA60BF` | 2592 U |  |
| Plum | `#845991` | 2603 U |  |
| Raisin | `#775D7A` | 519 U |  |
| Grape | `#6C5D80` | 2695 U |  |
| Scarlet | `#F65058` | RED 032 U |  |
| Tomato | `#D2515E` | 186 U |  |
| Cranberry | `#D1517A` | 214 U |  |
| Maroon | `#9E4C6E` | 221 U |  |
| Raspberry Red | `#D1517A` | 214U |  |
| Brick | `#A75154` | 1807 U |  |
| Light Lime | `#E3ED55` | 387 U |  |
| Sunflower | `#FFB511` | 116 U |  |
| Melon | `#FFAE3B` | 1235 U |  |
| Apricot | `#F6A04D` | 143 U |  |
| Paprika | `#EE7F4B` | 158 U |  |
| Pumpkin | `#FF6F4C` | 1655 U |  |
| Bright Olive Green | `#B49F29` | 103 U |  |
| Bright Gold | `#BA8032` | 131 U |  |
| Copper | `#BD6439` | 1525 U |  |
| Mahogany | `#8E595A` | 491 U |  |
| Bisque | `#F2CDCF` | 503 U |  |
| Bubble Gum | `#F984CA` | 231 U |  |
| Light Mauve | `#E6B5C9` | 7430 U |  |
| Dark Mauve | `#BD8CA6` | 687 U |  |
| Wine | `#914E72` | 235 U |  |
| Gray | `#928D88` | 403 U |  |
| White | `#FFFFFF` | — |  |
| Aqua | `#5EC8E5` | 637 U |  |
| Mint | `#82D8D5` | 324 U |  |
| Fluorescent Yellow | `#FFE900` | 803 U |  |
| Fluorescent Red | `#FF4C65` | 812 U |  |
| Fluorescent Green | `#44D62C` | 802 U |  |

## Fontes

- riso-colors (npm, MIT): https://www.npmjs.com/package/riso-colors
- Stencil Wiki, Riso Ink Colors (origem dos dados): http://stencil.wiki/colors
- UT Austin, Riso Ink Colors: https://cloud.wikis.utexas.edu/wiki/spaces/utprint/pages/53086355
- SAIC Service Bureau, Everything Riso 2024 (PDF): https://sites.saic.edu/servicebureau/wp-content/uploads/sites/20/2025/03/EverythingRiso_2024.pdf
