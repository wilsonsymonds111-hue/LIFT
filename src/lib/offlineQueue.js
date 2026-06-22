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
  const today = new Date().toISOString().slice(0, 10);

  const allExercises = await base44.entities.Exercise.list('name', 500);
  const exerciseMap = {};
  (allExercises || []).forEach(ex => { exerciseMap[ex.name] = ex; });

  const exerciseSaves = exerciseList
    .filter(ex => snapshot[ex.name])
    .map(async (ex) => {
      const best = snapshot[ex.name];
      const entry = { kg: best.kg, reps: best.reps, date: today };
      const existing = exerciseMap[ex.name];
      if (existing) {
        await base44.entities.Exercise.update(existing.id, {
          history: [...(existing.history || []), entry],
          muscle: ex.muscle || existing.muscle,
        });
      } else {
        await base44.entities.Exercise.create({
          name: ex.name,
          muscle: ex.muscle || '',
          history: [entry],
        });
      }
    });

  await base44.entities.WorkoutTemplate.update(templateId, {
    lastPerformed: new Date().toISOString(),
  });

  await Promise.all(exerciseSaves);
}

export async function saveWorkout(templateId, snapshot, exerciseList) {
  try {
    await processWorkoutSave({ templateId, snapshot, exerciseList });
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