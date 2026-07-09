import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';

const QUEUE_KEY = 'lift_offline_queue';

export function getQueuedSaves() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function queueWorkoutSave(data) {
  const queue = getQueuedSaves();
  queue.push({ id: Date.now().toString() + Math.random().toString(36).slice(2, 6), ...data });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeFromQueue(id) {
  const queue = getQueuedSaves().filter(item => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueueCount() {
  return getQueuedSaves().length;
}

async function processWorkoutSave({ templateId, snapshot, exerciseList }) {
  if (templateId.startsWith('empty-')) return;

  // Only count as "performed" if at least one set was actually completed
  const hasCompletedSets = Object.keys(snapshot || {}).length > 0;

  const allExercises = await base44.entities.Exercise.list('name', 500);
  const exerciseMap = {};
  (allExercises || []).forEach(ex => { exerciseMap[ex.name] = ex; });

  // Save the exercise list composition FIRST — this is the source of truth for
  // which exercises are in the template (including swaps, additions, removals).
  const exerciseListForSave = exerciseList.map(ex => ({
    name: ex.name,
    sets: ex.sets || 1,
    muscle: ex.muscle || '',
    history: ex.history || [],
  }));
  const templateUpdate = { exerciseList: exerciseListForSave };
  if (hasCompletedSets) {
    templateUpdate.lastPerformed = new Date().toISOString();
  }
  await base44.entities.WorkoutTemplate.update(templateId, templateUpdate);

  if (!hasCompletedSets) return;

  // Then save exercise history (sets/reps) to Exercise entities
  const today = new Date().toISOString().slice(0, 10);
  const exerciseSaves = exerciseList
    .filter(ex => snapshot[ex.name])
    .map(async (ex) => {
      const sets = snapshot[ex.name];
      const newEntries = sets.map(s => ({ kg: s.kg, reps: s.reps, date: today }));
      const existing = exerciseMap[ex.name];
      if (existing) {
        await base44.entities.Exercise.update(existing.id, {
          history: [...(existing.history || []), ...newEntries],
          muscle: ex.muscle || existing.muscle,
        });
      } else {
        await base44.entities.Exercise.create({
          name: ex.name,
          muscle: ex.muscle || '',
          history: newEntries,
        });
      }
    });

  await Promise.all(exerciseSaves);
}

export async function saveWorkout(templateId, snapshot, exerciseList) {
  try {
    await processWorkoutSave({ templateId, snapshot, exerciseList });
    queryClientInstance.invalidateQueries({ queryKey: ['exercise-history'] });
    queryClientInstance.invalidateQueries({ queryKey: ['workout-templates'] });
    return { saved: true, queued: false };
  } catch (e) {
    queueWorkoutSave({ templateId, snapshot, exerciseList });
    return { saved: false, queued: true };
  }
}

export async function syncOfflineQueue() {
  const queue = getQueuedSaves();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      await processWorkoutSave(item);
      removeFromQueue(item.id);
      synced++;
    } catch (e) {
      failed++;
    }
  }

  if (synced > 0) {
    queryClientInstance.invalidateQueries({ queryKey: ['exercise-history'] });
    queryClientInstance.invalidateQueries({ queryKey: ['workout-templates'] });
  }

  return { synced, failed };
}