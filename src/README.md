# src/ — código do Grão (1.0.0-rc.1)

Módulos ES, sem etapa de build: abra `index.html` por um servidor local (Live Server). Mapa com uma linha por
arquivo e as regras do objeto `app` no [`CLAUDE.md`](../CLAUDE.md).

```
src/
├── main.js        cria o objeto app, liga tudo, loop de quadros, exportações (PNG, vídeo, GIF, PNGs, prova, separações)
├── actions.js     desfazer, seleção, camadas, frames, copiar/colar, trocar projeto (testado sem navegador)
├── schedule.js    quando refazer máscaras (~8 ms por quadro; dependências do balde entre camadas)
├── view.js        zoom e posição do papel
├── quality.js     qualidade automática do compositor
├── config.js      constantes, tintas (9), papéis, limites de gesto
├── clock/         tempo virtual, velocidade, holds, exposição
├── doc/           projeto (tintas, camadas, traços, sanitize/migração), desfazer, boas-vindas
├── input/         input.js (caneta, botões, linha reta, laço, mover) e gestures.js (2 dedos, palma)
├── render/        stroke.js (pincéis), masks.js (máscaras e rasterização em alta), fill.js (balde),
│                  thumb.js (miniaturas), riso/ (compositor WebGL2 e shaders GLSL ES 3.00)
├── ui/            wheel.js (roda no canvas #ui), sheet.js (folhas HTML), dialog.js, debug.js
└── io/            storage.js (galeria), file.js (.grao), video.js, gif.js, zip.js
```

Na raiz: `index.html`, `styles.css`, `manifest.webmanifest`, `sw.js` (abrir sem internet), `assets/`.

## Regras

- Um módulo por responsabilidade; módulos não acessam o DOM de outros.
- `render/` não conhece a interface; `ui/` não conhece WebGL.
- Shaders em arquivos `.vert` / `.frag` separados, para portar ao Android sem mudança.
- Nada de dependência sem licença permissiva registrada nos créditos (hoje não há nenhuma no app).
- Mexeu em regra? Rode `tests/logic_test.mjs`. Arquivo novo em `src/`? Entra na lista do `sw.js`.
