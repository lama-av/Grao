// Arquivo de projeto .grao: o projeto inteiro em JSON (só traços; máscaras são refeitas ao abrir).
// Salvar = baixar o arquivo (no tablet vai para a pasta Downloads). Abrir = escolher um arquivo no aparelho.
// O salvamento automático no navegador (storage.js) continua por baixo, como rede de segurança.

import { sanitize } from '../doc/project.js';

export const FILE_EXT = '.grao';

// Nome de arquivo seguro a partir do nome do projeto ("Meu loop!" → "Meu-loop").
export function fileNameFor(project) {
  const base = (project.name || 'Sem título')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 _-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40);
  return (base || 'grao') + FILE_EXT;
}

export function projectToText(project) {
  return JSON.stringify({ ...project, saved: new Date().toISOString() });
}

// Lê o texto de um arquivo. Devolve o projeto já conferido, ou null se não for um projeto do Grão.
export function projectFromText(text) {
  let data;
  try { data = JSON.parse(text); } catch { return null; }
  if (!data || data.format !== 'grao-projeto' || !Array.isArray(data.layers)) return null;
  return sanitize(data);
}

export function downloadProject(project) {
  const blob = new Blob([projectToText(project)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileNameFor(project);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// Abre o seletor de arquivos do aparelho. Devolve { name, text } ou null se a pessoa desistir.
// Sem filtro de tipo: no Android, um filtro ".grao" esconde o arquivo (o sistema não conhece a extensão).
export function pickProjectFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    document.body.appendChild(input);
    let settled = false;
    const finish = (v) => { if (settled) return; settled = true; input.remove(); resolve(v); };
    input.onchange = async () => {
      const f = input.files && input.files[0];
      if (!f) { finish(null); return; }
      if (f.size > 50 * 1024 * 1024) { finish({ name: f.name, text: '' }); return; }
      try { finish({ name: f.name, text: await f.text() }); } catch { finish({ name: f.name, text: '' }); }
    };
    input.addEventListener('cancel', () => finish(null));
    input.click();
  });
}
