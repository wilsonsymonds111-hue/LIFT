import { ALL_EXERCISES } from './exercises';

const STORAGE_KEY = 'custom_exercises';

export function loadCustomExercises() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function saveCustomExercise(exercise) {
  try {
    const custom = loadCustomExercises();
    if (!custom.find(e => e.name.toLowerCase() === exercise.name.toLowerCase())) {
      custom.push(exercise);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
    }
  } catch {}
}

export function getAllExercises() {
  const custom = loadCustomExercises();
  const builtInNames = new Set(ALL_EXERCISES.map(e => e.name.toLowerCase()));
  const newOnes = custom.filter(e => !builtInNames.has(e.name.toLowerCase()));
  return [...ALL_EXERCISES, ...newOnes];
}