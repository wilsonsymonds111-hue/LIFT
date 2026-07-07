import { base44 } from '@/api/base44Client';

/**
 * For each template with lastPerformed === null, computes the most recent
 * exercise history date across all exercises in the template's exerciseList
 * and updates the template's lastPerformed field in the DB.
 *
 * Exercise history is stored in Exercise entities (keyed by name), separate
 * from WorkoutTemplate records. When templates are created fresh (e.g. via
 * SplitBuilder or example-split activation), lastPerformed is null even though
 * the exercises may have extensive history. This backfills it so workout cards
 * show the correct "last performed" time.
 *
 * @param {Array} templates — WorkoutTemplate records (must have exerciseList)
 * @returns {Promise<Object>} map of templateId → lastPerformed for those updated
 */
export async function backfillLastPerformed(templates) {
  const needsBackfill = (templates || []).filter(
    t => !t.lastPerformed && (t.exerciseList || []).length > 0
  );
  if (needsBackfill.length === 0) return {};

  // Fetch all Exercise entities once and build a name → latest date map
  const allExercises = await base44.entities.Exercise.list('name', 500);
  const latestByExercise = {};
  (allExercises || []).forEach(ex => {
    if (!ex.history || ex.history.length === 0) return;
    const dates = ex.history
      .map(h => h.date)
      .filter(Boolean)
      .sort();
    if (dates.length > 0) {
      latestByExercise[ex.name] = dates[dates.length - 1];
    }
  });

  const updates = {};
  for (const template of needsBackfill) {
    let latest = null;
    for (const ex of (template.exerciseList || [])) {
      const date = latestByExercise[ex.name];
      if (date && (!latest || date > latest)) {
        latest = date;
      }
    }
    if (latest) {
      // Ensure ISO format
      const iso = latest.includes('T') ? latest : latest + 'T00:00:00.000Z';
      updates[template.id] = iso;
    }
  }

  // Persist to DB
  await Promise.all(
    Object.entries(updates).map(([id, date]) =>
      base44.entities.WorkoutTemplate.update(id, { lastPerformed: date })
    )
  );

  return updates;
}