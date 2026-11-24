// Caixa de confirmação do Grão (substitui o confirm() do navegador, que só mostra OK/Cancelar).
// Só aparece com a caneta parada, como as folhas; o fundo escuro bloqueia o papel enquanto ela está aberta.
// Tocar no fundo não cancela (a palma encosta sem querer): só os dois botões respondem.
// Uso: if (await confirmDialog({ text, ok: 'Apagar e começar' })) { ... }

let current = null;

export function confirmDialog({ text, ok, cancel = 'Cancelar', danger = true }) {
  current?.(false);                       // só uma caixa por vez
  return new Promise((resolve) => {
    const back = document.createElement('div');
    back.className = 'dialog-back';
    back.innerHTML = `
      <div class="dialog" role="alertdialog" aria-modal="true">
        <p></p>
        <div class="row">
          <button class="btn" data-act="cancel"></button>
          <button class="btn ${danger ? 'danger' : 'on'}" data-act="ok"></button>
        </div>
      </div>`;
    back.querySelector('p').textContent = text;
    back.querySelector('[data-act="cancel"]').textContent = cancel;
    back.querySelector('[data-act="ok"]').textContent = ok;
    const done = (v) => {
      if (current !== done) return;
      current = null;
      back.remove();
      resolve(v);
    };
    current = done;
    back.querySelector('[data-act="cancel"]').onclick = () => done(false);
    back.querySelector('[data-act="ok"]').onclick = () => done(true);
    document.body.appendChild(back);
    back.querySelector('[data-act="cancel"]').focus();
  });
}
