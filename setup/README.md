# setup/

Arquivos de configuração que precisam ir para pastas protegidas.

## VS Code

Mova a pasta `setup/vscode/` para a raiz do projeto com o nome **`.vscode`** (com ponto):

```
GRÃO/
└── .vscode/
    ├── extensions.json   extensões recomendadas (Live Server, EditorConfig, GLSL)
    └── settings.json     Live Server acessível pelo tablet na rede (porta 5500)
```

No Windows: renomeie `setup\vscode` para `.vscode` e arraste para `GRÃO\`. Depois, apague esta pasta `setup/`.
