// Salvamento no próprio navegador (IndexedDB). Desde a v0.6 (#043): vários projetos (galeria).
// Chaves no depósito 'projetos': 'p:<uid>' = um projeto; 'atual' = uid do projeto aberto.
// Até a 0.5, 'atual' guardava o próprio projeto: na primeira abertura ele vira 'p:<uid>' (migração automática).

import { newUid } from '../doc/project.js';

const DB = 'grao';
const STORE = 'projetos';
const CURRENT = 'atual';
const key = (uid) => `p:${uid}`;

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const reqP = (req) => new Promise((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
const txDone = (tx) => new Promise((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });

// Projeto aberto da última vez (ou null).
export async function loadProject() {
  try {
    const db = await open();
    const st = db.transaction(STORE).objectStore(STORE);
    const cur = await reqP(st.get(CURRENT));
    if (!cur) return null;
    if (typeof cur === 'object') {          // formato até a 0.5: o projeto inteiro em 'atual'
      cur.uid = cur.uid || newUid();
      await saveProject(cur);
      return cur;
    }
    return (await reqP(db.transaction(STORE).objectStore(STORE).get(key(cur)))) || null;
  } catch (err) {
    console.warn('Grão: não consegui carregar o projeto salvo', err);
    return null;
  }
}

// Guarda o projeto (pelo uid) e marca como o aberto.
export async function saveProject(project) {
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  const st = tx.objectStore(STORE);
  const data = JSON.parse(JSON.stringify(project));
  data.modified = new Date().toISOString();
  st.put(data, key(project.uid));
  st.put(project.uid, CURRENT);
  return txDone(tx);
}

// Guarda um projeto sem abrir (duplicar na galeria).
export async function storeProject(project) {
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  const data = JSON.parse(JSON.stringify(project));
  data.modified = new Date().toISOString();
  tx.objectStore(STORE).put(data, key(project.uid));
  return txDone(tx);
}

// Todos os projetos do aparelho, do mais recente para o mais antigo.
export async function listProjects() {
  const db = await open();
  const st = db.transaction(STORE).objectStore(STORE);
  const out = [];
  await new Promise((resolve, reject) => {
    const req = st.openCursor();
    req.onsuccess = () => {
      const c = req.result;
      if (!c) { resolve(); return; }
      if (typeof c.key === 'string' && c.key.startsWith('p:') && c.value && typeof c.value === 'object') out.push(c.value);
      c.continue();
    };
    req.onerror = () => reject(req.error);
  });
  return out.sort((a, b) => String(b.modified || '').localeCompare(String(a.modified || '')));
}

export async function getProject(uid) {
  const db = await open();
  return (await reqP(db.transaction(STORE).objectStore(STORE).get(key(uid)))) || null;
}

export async function deleteProject(uid) {
  const db = await open();
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(key(uid));
  return txDone(tx);
}

// Salva no máximo uma vez a cada `ms`, sempre com o estado mais recente.
export function debounced(fn, ms) {
  let timer = null;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}
