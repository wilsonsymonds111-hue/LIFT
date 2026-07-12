import { base44 } from '@/api/base44Client';
import { backfillLastPerformed } from './backfillLastPerformed';

/**
 * Activates an example split without creating duplicate templates.
 * Checks the DB for existing templates with matching workout names first:
 * - If found, reactivates them (preserving their exercises and history)
 * - Only creates new templates for workouts that don't exist yet
 *
 * Also cleans up old inactive duplicate templates from previous activations.
 */
export async function activateExampleSplit(splitData, cycleConfig, currentActive, queryClient, invalidateFn) {
  const workoutNames = splitData.workouts.map(w => w.name);

  // Deactivate current active templates
  await Promise.all(currentActive.map(t =>
    base44.entities.WorkoutTemplate.update(t.id, { isActiveSplit: false })
  ));

  // Fetch all templates to find existing ones with matching names
  const allTemplates = await base44.entities.WorkoutTemplate.list('sort_order', 500);
  const existingByName = {};
  allTemplates.forEach(t => {
    // Match by name — prefer templates that are NOT currently active (they were just deactivated)
    if (workoutNames.includes(t.name) && !existingByName[t.name]) {
      existingByName[t.name] = t;
    }
  });

  const newGroupId = 'active_example_' + Date.now().toString();
  const toReactivate = [];
  const toCreate = [];

  splitData.workouts.forEach((w, i) => {
    if (existingByName[w.name]) {
      toReactivate.push({ template: existingByName[w.name], index: i });
    } else {
      toCreate.push({ workout: w, index: i });
    }
  });

  // Reactivate existing templates — preserve their exercises and history
  if (toReactivate.length > 0) {
    await Promise.all(toReactivate.map(({ template, index }) =>
      base44.entities.WorkoutTemplate.update(template.id, {
        isActiveSplit: true,
        splitGroup: newGroupId,
        sort_order: index,
        splitName: splitData.name,
        cycleOnDays: cycleConfig.cycleOn,
        cycleOffDays: cycleConfig.cycleOff,
        cycleStartDayIndex: cycleConfig.cycleStart,
      })
    ));
  }

  // Create only the missing templates
  if (toCreate.length > 0) {
    const newTemplates = toCreate.map(({ workout, index }) => ({
      name: workout.name,
      exercises: workout.exercises.map(e => e.name).join(', '),
      exerciseList: workout.exercises.map(e => ({ ...e, history: [] })),
      lastPerformed: null,
      sort_order: index,
      isActiveSplit: true,
      splitGroup: newGroupId,
      splitName: splitData.name,
      cycleOnDays: cycleConfig.cycleOn,
      cycleOffDays: cycleConfig.cycleOff,
      cycleStartDayIndex: cycleConfig.cycleStart,
    }));
    await base44.entities.WorkoutTemplate.bulkCreate(newTemplates);
  }

  // Clean up old inactive duplicate templates from previous example activations
  // (keep active ones and custom splits)
  const refreshed = await base44.entities.WorkoutTemplate.list('sort_order', 500);
  const staleIds = refreshed
    .filter(t =>
      !t.isActiveSplit &&
      t.splitGroup &&
      t.splitGroup.startsWith('active_example_') &&
      t.splitGroup !== newGroupId
    )
    .map(t => t.id);

  if (staleIds.length > 0) {
    await Promise.all(staleIds.map(id => base44.entities.WorkoutTemplate.delete(id)));
  }

  // Backfill lastPerformed for reactivated templates that have none
  const activated = refreshed.filter(t => t.isActiveSplit && !t.lastPerformed);
  if (activated.length > 0) {
    try { await backfillLastPerformed(activated); } catch {}
  }

  if (invalidateFn) invalidateFn(queryClient);
}