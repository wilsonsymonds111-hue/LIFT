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
  showNotification("Rest's up! 🏋️", 'Get back to work');
}

export function showNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = {
    body,
    tag: title,
    requireInteraction: true,
    silent: false,
  };
  try {
    // Service Worker notifications work on Android Chrome and are required
    // for iOS 16.4+ PWA push. Falls back to the synchronous API on desktop.
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg =>
        reg.showNotification(title, opts)
      ).catch(() => new Notification(title, opts));
    } else {
      new Notification(title, opts);
    }
  } catch (_) {}
}