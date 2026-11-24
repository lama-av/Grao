// Painel de teste da Fase 0 (docs/08-testes-fase-0.md): o que chega da caneta e quanto custa o quadro.

export function setupDebug(app, box) {
  let visible = false;
  let last = null;
  let events = 0, eventsPerSec = 0, frames = 0, fps = 0, windowStart = performance.now();

  function pointer(e) {
    events++;
    last = {
      type: e.pointerType,
      pressure: e.pressure,
      tiltX: e.tiltX,
      tiltY: e.tiltY,
      buttons: e.buttons,
      coalesced: e.getCoalescedEvents ? e.getCoalescedEvents().length : 1,
      hover: e.pointerType === 'pen' && e.buttons === 0,
    };
  }

  function frame() {
    frames++;
    const now = performance.now();
    if (now - windowStart >= 1000) {
      fps = frames; eventsPerSec = events; frames = 0; events = 0; windowStart = now;
    }
    if (!visible) return;
    const p = last || {};
    box.textContent = [
      `baixa latência: ${app.lowLatency ? 'sim' : 'NÃO'}`,
      `quadros/s: ${fps}   compositor: ${app.riso.lastMs.toFixed(1)} ms (CPU)`,
      `eventos/s: ${eventsPerSec}`,
      `tipo: ${p.type ?? '—'}   botões: ${p.buttons ?? '—'}   hover: ${p.hover ? 'sim' : 'não'}`,
      `pressão: ${p.pressure?.toFixed(3) ?? '—'}`,
      `inclinação: x ${p.tiltX ?? '—'}  y ${p.tiltY ?? '—'}`,
      `pontos por evento: ${p.coalesced ?? '—'}`,
      `qualidade do riso: ${String(app.quality?.scale ?? 1).replace('.', ',')}× (automática: ${app.project.settings.autoQuality === false ? 'não' : 'sim'})`,
      `versão: ${app.version}-${app.build || ''}`,
      `toques ignorados (palma): ${app.input?.gestures?.stats.ignored ?? 0}  último motivo: ${app.input?.gestures?.stats.lastReason || '—'}`,
      `último toque: ${app.input?.gestures?.stats.lastW ?? '—'} × ${app.input?.gestures?.stats.lastH ?? '—'} px`,
    ].join('\n');
  }

  function setVisible(v) { visible = v; box.hidden = !v; }

  return { pointer, frame, setVisible, box, get visible() { return visible; } };
}
