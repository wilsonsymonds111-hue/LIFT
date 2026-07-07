// Haptic-only feedback for workout events.
// We intentionally do NOT play audio (HTML5 Audio or Web Audio API) because on iOS
// any audio playback claims exclusive audio focus and pauses background music (Spotify).
// Vibration + notifications provide feedback without interrupting the user's music.

export function playTick() {
  if (navigator.vibrate) {
    try { navigator.vibrate(15); } catch (_) {}
  }
}

export function playCompleteChime() {
  if (navigator.vibrate) {
    try { navigator.vibrate([100, 50, 100, 50, 200]); } catch (_) {}
  }
}

export function notifyRestComplete(silent = false) {
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