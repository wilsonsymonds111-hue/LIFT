// Haptic + audio feedback for workout events.
// Uses Web Audio API (decoded buffer) for instant playback once loaded,
// with an HTML5 Audio fallback so it always plays even before the buffer is ready.

const SOUND_URL = 'https://media.base44.com/files/public/6a16b583ab0ebad6332038a3/ee0d3ce4e_ScreenRecording_06-16-202607-45-53_12.mp3';

let _ctx = null;
let _buffer = null;
let _loading = false;
let _audioEl = null;

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

function getAudioEl() {
  if (!_audioEl) {
    try {
      _audioEl = new Audio(SOUND_URL);
      _audioEl.preload = 'auto';
      _audioEl.volume = 1;
    } catch (_) { return null; }
  }
  return _audioEl;
}

// Pre-decode the audio file into a buffer for zero-latency playback.
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

// Call on first user gesture: unlocks iOS audio + starts decoding the buffer
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx) loadBuffer();
  getAudioEl(); // preload the fallback element too
}

function playSound() {
  // Prefer the decoded buffer (instant, no seek delay)
  const ctx = getCtx();
  if (ctx && _buffer) {
    const src = ctx.createBufferSource();
    src.buffer = _buffer;
    src.connect(ctx.destination);
    src.start(0);
    return;
  }
  // Fallback: HTML5 Audio (works even before buffer is decoded)
  const a = getAudioEl();
  if (a) {
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

export function playTick() {
  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
  playSound();
}

export function playCompleteChime() {
  if (navigator.vibrate) {
    try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (_) {}
  }
  playSound();
}

export function notifyRestComplete(silent = false) {
  if (navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch (_) {}
  }
  if (!silent) playSound();
}