// Native haptic feedback.
// Uses Capacitor's native bridge when available (works on iOS when wrapped),
// falls back to the Web Vibration API (Android only — iOS blocks web vibration).

const HAPTIC_STYLE = { light: 'light', medium: 'medium', heavy: 'heavy' };

export function triggerHaptic(style = 'light') {
  // Capacitor native bridge (iOS + Android when wrapped with Capacitor)
  const cap = typeof window !== 'undefined' && window.Capacitor;
  if (cap?.Plugins?.Haptics?.impact) {
    cap.Plugins.Haptics.impact({ style: HAPTIC_STYLE[style] || 'light' });
    return;
  }
  // Web Vibration API (Android only)
  if (typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(10); } catch (_) {}
  }
}

export function triggerHapticPattern(pattern) {
  // Capacitor doesn't support custom vibration patterns — use notification API
  const cap = typeof window !== 'undefined' && window.Capacitor;
  if (cap?.Plugins?.Haptics?.notification) {
    cap.Plugins.Haptics.notification({ type: 'SUCCESS' });
    return;
  }
  if (typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(pattern); } catch (_) {}
  }
}