const SET_COMPLETE_SOUND = 'https://media.base44.com/files/public/6a16b583ab0ebad6332038a3/87d1fec3a_ScreenRecording_06-16-202607-45-53_12.mp3';
const LEVEL_COMPLETE_SOUND = 'https://media.base44.com/files/public/6a16b583ab0ebad6332038a3/b340fae3c_universfield-game-level-complete-143022.mp3';

let _audioEl = null;
let _levelCompleteEl = null;

function _ensureAudio() {
  if (!_audioEl) {
    _audioEl = new Audio(SET_COMPLETE_SOUND);
    _audioEl.preload = 'auto';
    _audioEl.load();
  }
}
function _ensureLevelComplete() {
  if (!_levelCompleteEl) {
    _levelCompleteEl = new Audio(LEVEL_COMPLETE_SOUND);
    _levelCompleteEl.preload = 'auto';
    _levelCompleteEl.load();
  }
}
_ensureAudio();
_ensureLevelComplete();

export function playCompleteChime() {
  if (!_levelCompleteEl) _ensureLevelComplete();
  if (!_levelCompleteEl) return;
  _levelCompleteEl.currentTime = 0;
  _levelCompleteEl.play().catch(() => {});
}

export function playTick() {
  if (!_audioEl) _ensureAudio();
  if (!_audioEl) return;
  _audioEl.currentTime = 0;
  _audioEl.play().catch(() => {});
}

export function notifyRestComplete() {
  playTick();
  if (navigator.vibrate) {
    try { navigator.vibrate([200, 100, 200]); } catch (_) {}
  }
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification("Rest's up! 🏋️", {
        body: 'Get back to work',
        tag: 'rest-timer',
        requireInteraction: true,
      });
    } catch (_) {}
  }
}