# Gera docs/versoes/Grao_Documentacao_vX.Y.Z.docx com toda a documentação da versão (regra do CLAUDE.md).
# Uso: python tools/gerar_docx.py 0.2.0 [caminho do pandoc]
# Precisa do pandoc (https://pandoc.org; a versão portátil em .zip basta, sem instalar).
# Nunca sobrescreve o .docx de uma versão que já existe.
import os, subprocess, sys, tempfile, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
version = sys.argv[1] if len(sys.argv) > 1 else sys.exit('Uso: python tools/gerar_docx.py 0.2.0 [pandoc]')
pandoc = sys.argv[2] if len(sys.argv) > 2 else 'pandoc'
out = os.path.join(ROOT, 'docs', 'versoes', f'Grao_Documentacao_v{version}.docx')
if os.path.exists(out):
    sys.exit(f'Já existe: {out}. Versões antigas não são sobrescritas.')

def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read().strip()

docs = sorted(f for f in os.listdir(os.path.join(ROOT, 'docs')) if f[:2].isdigit() and f.endswith('.md'))
adrs = sorted(f for f in os.listdir(os.path.join(ROOT, 'docs', 'adr')) if f.startswith('ADR-') and '000' not in f)
reports = sorted(f for f in os.listdir(os.path.join(ROOT, 'docs')) if f.startswith('relatorio-') and f.endswith('.md'))

parts = [f'''---
title: "Grão — Documentação v{version}"
subtitle: "Caderno de animação em loop com estética de risografia"
date: "{datetime.date.today().strftime('%d/%m/%Y')}"
lang: pt-BR
toc-title: Sumário
---''']
parts += [read(f'docs/{f}') for f in docs]
parts += [read(f'docs/adr/{f}') for f in adrs]
parts += [read(f'docs/{f}') for f in reports]
parts.append('# Instruções de uso\n\n```text\n' + read('INSTRUCOES.txt') + '\n```')
changelog = read('CHANGELOG.md').split('\n', 1)[1]   # tira o título "# Changelog"
parts.append('# Histórico de versões (CHANGELOG)\n' + changelog.replace('\n## ', '\n### ').replace('\n### [', '\n## ['))

with tempfile.NamedTemporaryFile('w', suffix='.md', delete=False, encoding='utf-8') as tmp:
    tmp.write('\n\n'.join(parts) + '\n')
cmd = [pandoc, tmp.name, '-f', 'gfm+yaml_metadata_block', '-o', out, '--toc', '--toc-depth=2',
       '--resource-path', os.path.join(ROOT, 'docs')]
prev = sorted(f for f in os.listdir(os.path.join(ROOT, 'docs', 'versoes')) if f.endswith('.docx'))
if prev:   # mantém o visual do docx anterior
    cmd += ['--reference-doc', os.path.join(ROOT, 'docs', 'versoes', prev[-1])]
subprocess.run(cmd, check=True)
os.unlink(tmp.name)
print('Gerado:', out)
