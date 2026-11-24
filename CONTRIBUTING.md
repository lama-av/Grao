# Como desenvolver e testar

## Ferramentas

- **VS Code** com as extensões recomendadas (o VS Code oferece instalar ao abrir a pasta):
  - Live Server — servidor local para testar no tablet
  - EditorConfig — mantém a formatação igual em todos os arquivos
  - Shader languages support — destaque de sintaxe para GLSL
- **Chrome** no tablet.
- Opcional: **Git** e uma conta no **GitHub** (histórico e publicação no GitHub Pages).

## Testar no tablet

1. Computador e tablet na **mesma rede Wi-Fi**.
2. No VS Code, clique em **Go Live** (canto inferior direito). Abre em `http://127.0.0.1:5500`.
3. Descubra o IP do computador (Windows: `ipconfig` no terminal, procure "Endereço IPv4").
4. No Chrome do tablet, abra `http://IP-DO-COMPUTADOR:5500`.
5. Salve um arquivo no VS Code → recarregue a página no tablet.

> Alguns recursos (service worker, instalação como app) exigem HTTPS fora do `localhost`.
> Para testá-los, use a versão publicada no GitHub Pages.

### Ver erros do tablet no computador

1. No tablet: Configurações → Sobre o tablet → toque 7× em "Número da versão" → Opções do desenvolvedor → **Depuração USB**.
2. Ligue o tablet no computador por cabo.
3. No Chrome do computador, abra `chrome://inspect` e clique em **inspect** na aba do Grão.
4. O console mostra os erros. Cole a mensagem no chat com o Claude.

## Publicar (GitHub Pages)

1. Crie um repositório no GitHub e envie esta pasta.
2. Settings → Pages → Source: branch `main`, pasta `/ (root)`.
3. O Grão fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Fluxo de trabalho com o Claude

1. Raphael descreve o que sentiu no tablet ("a roda tá dura", "o laço pega traço demais").
2. Claude altera o código e diz o que testar.
3. Raphael recarrega no tablet e responde.
4. Mudança visível → linha no `CHANGELOG.md`. Decisão de arquitetura → novo ADR.

## Regras de código

- Sem build e sem framework pesado no v0.1. Módulos ES (`<script type="module">`).
- Dependências externas: só com licença permissiva (MIT, BSD, Apache, domínio público) e registradas nos créditos.
- Leia o `CLAUDE.md` antes de mudanças grandes: ele lista as decisões que não devem ser desfeitas sem conversa.
