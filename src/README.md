# src/ — código do Grão

Código do v0.1.0 (ver [design do sistema](../docs/04-design-sistema-v0.1.md)). Módulos ES, sem etapa de build: abra `index.html` por um servidor local (Live Server).

Arquivos de hoje: `main.js`, `config.js`, `doc/project.js`, `doc/history.js`, `clock/clock.js`, `render/stroke.js`, `render/masks.js`, `render/riso/riso.{js,vert,frag}`, `input/input.js`, `ui/thumbzone.js`, `ui/debug.js`, `io/storage.js`.

Estrutura combinada (o que ainda não existe fica para as próximas versões):

```
src/
├── main.js        liga tudo: cria canvas, inicia relógio e loop de quadros
├── input/         Pointer Events, caneta × dedo, palma (pointercancel), modos segurados
├── doc/           projeto, tintas, frames, traços (JSON), pilha de desfazer
├── clock/         fonte de relógio trocável (interno; MIDI na 1.1), frame por camada, velocidade, ferver
├── render/
│   ├── wet/       traço molhado: canvas 2D desynchronized, por cima de tudo
│   ├── masks/     traço → máscara de 1 canal por frame (soma tinta, subtrai recorte)
│   └── riso/      compositor WebGL2 e shaders GLSL ES 3.00 (.vert / .frag)
├── ui/            zona do polegar, roda de tempo (prato) + fader de velocidade, tecla de laço, desfazer
└── io/            IndexedDB, exportar vídeo, GIF, PNG, SVG por tinta
```

Na raiz do projeto, quando houver código:

```
index.html               página única; carrega src/main.js como módulo
manifest.webmanifest     nome, ícone, tela cheia (PWA)
sw.js                    service worker para funcionar offline
assets/                  ícones e texturas geradas
```

## Regras

- Um módulo por responsabilidade; módulos não acessam o DOM de outros.
- `render/` não conhece a interface; `ui/` não conhece WebGL.
- Shaders em arquivos `.vert` / `.frag` separados, para portar ao Android sem mudança.
- Nada de dependência sem licença permissiva registrada nos créditos.
