// Haptic + audio feedback for workout events.
// Uses Web Audio API with a pre-decoded AudioBuffer for near-zero latency.

const SOUND_URL = 'https://media.base44.com/files/public/6a16b583ab0ebad6332038a3/ee0d3ce4e_ScreenRecording_06-16-202607-45-53_12.mp3';

let _ctx = null;
let _buffer = null;
let _loading = false;

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

// Pre-decode the audio file into a buffer so playback is instant.
// Called eagerly on first user gesture (unlockAudio).
async function loadBuffer() {
  const ctx = getCtx();
  if (!ctx || _buffer || _loading) return;
  _loading = true;
  try {
    const res = await fetch(SOUND_URL);
    const arr = await res.arrayBuffer();
    _buffer = await ctx.decodeAudioData(arr);
  } catch (_) {}
  _loading = false;
}

// Call once on first user gesture so iOS unlocks audio + starts decoding
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx) loadBuffer();
}

function playBuffer() {
  const ctx = getCtx();
  if (!ctx || !_buffer) return;
  const src = ctx.createBufferSource();
  src.buffer = _buffer;
  src.connect(ctx.destination);
  src.start(0);
}

export function playTick() {
  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
  playBuffer();
}

export function playCompleteChime() {
  if (navigator.vibrate) {
    try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (_) {}
  }
  playBuffer();
}

export function notifyRestComplete(silent = false) {
  if (navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch (_) {}
  }
  if (!silent) playBuffer();
}