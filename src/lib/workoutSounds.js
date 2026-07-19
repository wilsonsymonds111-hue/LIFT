// Haptic + audio feedback for workout events.
// Uses Web Audio API (oscillators) — no audio files, short and subtle.

let _ctx = null;
function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!_ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      _ctx = new AC();
    } catch (_) { return null; }
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

// Call once on first user gesture so iOS unlocks audio
export function unlockAudio() {
  getCtx();
}

function tone(freq, start, dur, gain = 0.15, type = 'sine') {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playTick() {
  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
  // Short crisp click
  tone(880, 0, 0.08, 0.12, 'triangle');
}

export function playCompleteChime() {
  if (navigator.vibrate) {
    try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (_) {}
  }
  // Pleasant ascending 3-note chime
  tone(660, 0, 0.12, 0.14, 'sine');
  tone(880, 0.1, 0.12, 0.14, 'sine');
  tone(1320, 0.2, 0.2, 0.16, 'sine');
}

export function notifyRestComplete(silent = false) {
  if (navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch (_) {}
  }
  if (!silent) {
    tone(523, 0, 0.15, 0.16, 'sine');
    tone(784, 0.15, 0.25, 0.16, 'sine');
  }
}