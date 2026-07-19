// Haptic + audio feedback for workout events.
// Uses the user-provided sound clip for set completion.

const SOUND_URL = 'https://media.base44.com/files/public/6a16b583ab0ebad6332038a3/ee0d3ce4e_ScreenRecording_06-16-202607-45-53_12.mp3';

let _audio = null;
function getAudio() {
  if (typeof window === 'undefined') return null;
  if (!_audio) {
    try {
      _audio = new Audio(SOUND_URL);
      _audio.preload = 'auto';
      _audio.volume = 1;
    } catch (_) { return null; }
  }
  return _audio;
}

// Call once on first user gesture so iOS unlocks audio
export function unlockAudio() {
  const a = getAudio();
  if (a) {
    // Play + immediately pause to satisfy iOS unlock without audible playback
    a.play().then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
  }
}

export function playTick() {
  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
  const a = getAudio();
  if (a) {
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

export function playCompleteChime() {
  if (navigator.vibrate) {
    try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (_) {}
  }
  const a = getAudio();
  if (a) {
    a.currentTime = 0;
    a.play().catch(() => {});
  }
}

export function notifyRestComplete(silent = false) {
  if (navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch (_) {}
  }
  if (!silent) {
    const a = getAudio();
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  }
}