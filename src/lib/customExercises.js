import { ALL_EXERCISES } from './exercises';
import { base44 } from '@/api/base44Client';

const BUILTIN_NAMES = new Set(ALL_EXERCISES.map(e => e.name.toLowerCase()));
const OLD_STORAGE_KEY = 'custom_exercises';
const MIGRATION_KEY = 'custom_exercises_migrated';

// --- localStorage fallback (guests / offline) ---
function loadLocal() {
  try { return JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveLocal(exercises) {
  try { localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(exercises)); } catch {}
}

async function canUseCloud() {
  try { return await base44.auth.isAuthenticated(); } catch { return false; }
}

// One-time migration of localStorage custom exercises → cloud
let migrationPromise = null;
function migrateLocalToCloud() {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    try {
      if (localStorage.getItem(MIGRATION_KEY)) return;
      const local = loadLocal();
      if (local.length === 0) { localStorage.setItem(MIGRATION_KEY, 'true'); return; }
      if (!(await canUseCloud())) return;
      for (const ex of local) {
        try {
          const existing = await base44.entities.CustomExercise.filter({ name: ex.name });
          if (existing.length === 0) {
            await base44.entities.CustomExercise.create({ name: ex.name, muscle: ex.muscle || 'Full Body' });
          }
        } catch {}
      }
      localStorage.setItem(MIGRATION_KEY, 'true');
      localStorage.removeItem(OLD_STORAGE_KEY);
    } catch {}
  })();
  return migrationPromise;
}

export async function loadCustomExercises() {
  if (await canUseCloud()) {
    await migrateLocalToCloud();
    try { return await base44.entities.CustomExercise.list(); } catch { return []; }
  }
  return loadLocal();
}

export async function saveCustomExercise(exercise) {
  if (await canUseCloud()) {
    await migrateLocalToCloud();
    try {
      const existing = await base44.entities.CustomExercise.filter({ name: exercise.name });
      if (existing.length === 0) {
        await base44.entities.CustomExercise.create({ name: exercise.name, muscle: exercise.muscle || 'Full Body' });
      }
    } catch {}
    return;
  }
  // Guest fallback
  const custom = loadLocal();
  if (!custom.find(e => e.name.toLowerCase() === exercise.name.toLowerCase())) {
    custom.push(exercise);
    saveLocal(custom);
  }
}

export async function getAllExercises() {
  const custom = await loadCustomExercises();
  const newOnes = custom
    .filter(e => !BUILTIN_NAMES.has(e.name.toLowerCase()))
    .map(e => ({ name: e.name, muscle: e.muscle || 'Full Body' }));
  return [...ALL_EXERCISES, ...newOnes];
}

export function isCustomExercise(name) {
  return !BUILTIN_NAMES.has(name.toLowerCase());
}

export async function deleteCustomExercise(name) {
  if (await canUseCloud()) {
    try {
      const existing = await base44.entities.CustomExercise.filter({ name });
      for (const ex of existing) {
        await base44.entities.CustomExercise.delete(ex.id);
      }
    } catch {}
    return;
  }
  // Guest fallback
  const custom = loadLocal();
  saveLocal(custom.filter(e => e.name.toLowerCase() !== name.toLowerCase()));
}