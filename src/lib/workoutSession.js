// Persists the in-progress workout session to localStorage so that if the
// app is killed (e.g. user swipes away on iPhone), the live workout can be
// restored exactly as it was — exercises, completed sets, notes, and elapsed
// time all preserved.

const SESSION_KEY = 'lift_active_workout_session';

export function saveWorkoutSession(session) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export function loadWorkoutSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearWorkoutSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}