import { saveWorkout } from './offlineQueue';
import { clearWorkoutSession } from './workoutSession';

const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

export function isSessionStale(session) {
  if (!session?.startTime) return false;
  return Date.now() - session.startTime > STALE_THRESHOLD_MS;
}

export function sessionHasData(session) {
  if (!session) return false;
  if (session.bestSets && Object.keys(session.bestSets).length > 0) return true;
  const exerciseState = session.exerciseState || {};
  for (const name of Object.keys(exerciseState)) {
    const state = exerciseState[name];
    if (state?.completedSets) {
      const completed = Object.values(state.completedSets).filter(Boolean);
      if (completed.length > 0) return true;
    }
  }
  return false;
}

// Silently finishes or cancels a stale workout session.
// If the user entered set data, saves the history (auto-finish).
// If no data was entered, just discards the session (auto-cancel).
export async function handleStaleSession(session) {
  if (!session) return;
  const hasData = sessionHasData(session);

  // Clear immediately so the stale session isn't restored again
  clearWorkoutSession();

  if (hasData && session.templateId && !session.templateId.startsWith('empty-')) {
    const allSets = {};
    for (const ex of (session.exercises || [])) {
      const state = session.exerciseState?.[ex.name];
      if (state?.completedSets) {
        const completed = Object.values(state.completedSets).filter(Boolean);
        if (completed.length > 0) {
          allSets[ex.name] = completed;
        }
      }
    }
    try {
      await saveWorkout(session.templateId, allSets, session.exercises || []);
    } catch {}
  }
}