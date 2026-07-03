import { ALL_EXERCISES } from './exercises';

const STORAGE_KEY = 'custom_exercises';

// Module-level Set — avoids rebuilding from ALL_EXERCISES on every call
const BUILTIN_NAMES = new Set(ALL_EXERCISES.map(e => e.name.toLowerCase()));

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
  const newOnes = custom.filter(e => !BUILTIN_NAMES.has(e.name.toLowerCase()));
  return [...ALL_EXERCISES, ...newOnes];
}

export function isCustomExercise(name) {
  return !BUILTIN_NAMES.has(name.toLowerCase());
}

export function deleteCustomExercise(name) {
  try {
    const custom = loadCustomExercises();
    const filtered = custom.filter(e => e.name.toLowerCase() !== name.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
}