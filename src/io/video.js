// Exportar vídeo: grava o canvas do riso enquanto o loop toca (MediaRecorder). Sem biblioteca.
// MP4 (H.264) quando o Chrome sabe gravar; senão WebM. O loop nunca para (decisão 7): a gravação acontece
// em tempo real, com o loop tocando desde o frame 1, e a interface (roda, traço molhado) fica de fora,
// porque está em outros canvases.

const TYPES = [
  ['video/mp4;codecs=avc1.42E01E', 'mp4'],
  ['video/mp4;codecs=avc1', 'mp4'],
  ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9', 'webm'],
  ['video/webm;codecs=vp8', 'webm'],
  ['video/webm', 'webm'],
];
const MAX_SECONDS = 12;     // loops muito longos (polimetria) são cortados aqui
const MIN_SECONDS = 3;      // loop curto repete até dar pelo menos isso (bom para redes)

export function videoFormat() {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const [type, ext] of TYPES) if (MediaRecorder.isTypeSupported(type)) return { type, ext };
  return null;
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// Duração de um ciclo completo: quando todas as tintas desenhadas voltam juntas ao frame 1.
// Cada FPS possível (6, 8, 12, 24) divide 24, então medimos em 1/24 s.
export function loopSeconds(project) {
  const used = project.layers.filter((L) => L.frames.some((f) => f.length));
  const layers = used.length ? used : [project.layers[project.activeLayer]];
  let lcm = 1;
  for (const L of layers) {
    const ticks = Math.round((L.frames.length * 24) / L.fps);
    lcm = (lcm * ticks) / gcd(lcm, ticks);
    if (lcm / 24 > MAX_SECONDS) return MAX_SECONDS;
  }
  return lcm / 24;
}

// Quanto gravar: ciclos inteiros até passar de MIN_SECONDS (sem passar de MAX_SECONDS).
export function recordSeconds(project) {
  const one = loopSeconds(project);
  const reps = Math.max(1, Math.ceil(MIN_SECONDS / one - 1e-9));
  return Math.min(MAX_SECONDS, one * reps);
}

// Grava `seconds` do canvas. Devolve uma Promise com o Blob do vídeo.
export function recordCanvas(canvas, seconds, format, fps = 30) {
  return new Promise((resolve, reject) => {
    let rec;
    try {
      const stream = canvas.captureStream(fps);
      rec = new MediaRecorder(stream, { mimeType: format.type, videoBitsPerSecond: 8_000_000 });
    } catch (err) { reject(err); return; }
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onerror = (e) => reject(e.error || new Error('gravação falhou'));
    rec.onstop = () => {
      for (const t of rec.stream.getTracks()) t.stop();
      resolve(new Blob(chunks, { type: format.type.split(';')[0] }));
    };
    rec.start(250);
    setTimeout(() => { if (rec.state !== 'inactive') rec.stop(); }, seconds * 1000 + 120);
  });
}
