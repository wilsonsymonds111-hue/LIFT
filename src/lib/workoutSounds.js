// Haptic + audio feedback for workout events.
// Uses Web Audio API (decoded buffer) for instant playback once loaded,
// with an HTML5 Audio fallback so it always plays even before the buffer is ready.

import { triggerHaptic, triggerHapticPattern } from './haptics';

const TICK_URL = 'https://media.base44.com/files/public/6a16b583ab0ebad6332038a3/ee0d3ce4e_ScreenRecording_06-16-202607-45-53_12.mp3';
const COMPLETE_URL = 'https://media.base44.com/files/public/6a16b583ab0ebad6332038a3/5571535bc_universfield-game-level-complete-143022.mp3';

let _ctx = null;
let _buffers = {};       // url -> AudioBuffer
let _loading = new Set();
let _audioEls = {};      // url -> HTMLAudioElement

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

function getAudioEl(url) {
  if (!_audioEls[url]) {
    try {
      const el = new Audio(url);
      el.preload = 'auto';
      el.volume = 1;
      _audioEls[url] = el;
    } catch (_) { return null; }
  }
  return _audioEls[url];
}

// Pre-decode an audio file into a buffer for zero-latency playback.
async function loadBuffer(url) {
  const ctx = getCtx();
  if (!ctx || _buffers[url] || _loading.has(url)) return;
  _loading.add(url);
  try {
    const res = await fetch(url);
    const arr = await res.arrayBuffer();
    _buffers[url] = await ctx.decodeAudioData(arr);
  } catch (_) {}
  _loading.delete(url);
}

// Call on first user gesture: unlocks iOS audio + starts decoding buffers
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx) {
    loadBuffer(TICK_URL);
    loadBuffer(COMPLETE_URL);
  }
  getAudioEl(TICK_URL);
  getAudioEl(COMPLETE_URL);
}

function playSound(url) {
  // Prefer the decoded buffer (instant, no seek delay)
  const ctx = getCtx();
  if (ctx && _buffers[url]) {
    const src = ctx.createBufferSource();
    src.buffer = _buffers[url];
    src.connect(ctx.destination);
    src.start(0);
    return;
  }
  // Fallback: HTML5 Audio (works even before buffer is decoded)
  const a = getAudioEl(url);
  if (a) {
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

export function playTick() {
  triggerHaptic('light');
  playSound(TICK_URL);
}

export function playCompleteChime() {
  triggerHapticPattern([100, 50, 100, 50, 200]);
  playSound(COMPLETE_URL);
}

export function notifyRestComplete(silent = false) {
  triggerHapticPattern([200, 100, 200]);
  if (!silent) playSound(TICK_URL);
}