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
  // Case-insensitive map — also merges histories from duplicate entities
  // so history isn't fragmented across multiple records with the same name
  const exerciseMap = {};
  (allExercises || []).forEach(ex => {
    const key = ex.name.toLowerCase();
    if (!exerciseMap[key]) {
      exerciseMap[key] = { primary: ex, all: [ex] };
    } else {
      exerciseMap[key].all.push(ex);
      // Keep the one with the most history as "primary" for updating
      if ((ex.history?.length || 0) > (exerciseMap[key].primary.history?.length || 0)) {
        exerciseMap[key].primary = ex;
      }
    }
  });

  const today = new Date().toISOString().slice(0, 10);

  // Build the exercise list with UPDATED history (existing + new entries) so
  // the template stays in sync with the Exercise entities after each workout.
  const exerciseListForSave = exerciseList.map(ex => {
    const entry = exerciseMap[ex.name.toLowerCase()];
    // Merge history from ALL duplicates to avoid fragmentation
    const mergedHistory = entry
      ? entry.all.flatMap(e => e.history || [])
      : (ex.history || []);
    const sets = snapshot[ex.name];
    const newEntries = sets ? sets.map(s => ({ kg: s.kg, reps: s.reps, date: today })) : [];
    return {
      name: ex.name,
      sets: ex.sets || 1,
      muscle: ex.muscle || '',
      history: [...mergedHistory, ...newEntries],
    };
  });

  const templateUpdate = {
    exerciseList: exerciseListForSave,
    exercises: exerciseListForSave.map(e => e.name).join(', '),
  };
  if (hasCompletedSets) {
    templateUpdate.lastPerformed = new Date().toISOString();
  }
  await base44.entities.WorkoutTemplate.update(templateId, templateUpdate);

  if (!hasCompletedSets) return;
  const exerciseSaves = exerciseList
    .filter(ex => snapshot[ex.name])
    .map(async (ex) => {
      const sets = snapshot[ex.name];
      const newEntries = sets.map(s => ({ kg: s.kg, reps: s.reps, date: today }));
      const entry = exerciseMap[ex.name.toLowerCase()];
      if (entry) {
        // Update the primary entity with merged history from all duplicates
        const mergedHistory = entry.all.flatMap(e => e.history || []);
        await base44.entities.Exercise.update(entry.primary.id, {
          history: [...mergedHistory, ...newEntries],
          muscle: ex.muscle || entry.primary.muscle,
        });
        // Delete non-primary duplicates to prevent future fragmentation
        const duplicates = entry.all.filter(e => e.id !== entry.primary.id);
        await Promise.all(duplicates.map(d => base44.entities.Exercise.delete(d.id)));
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