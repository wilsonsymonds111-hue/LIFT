import { getExerciseDetailList } from './exerciseCache';

// Returns an ExerciseDetail record for the given exercise name if one exists.
// No longer generates AI images — images must be uploaded by the user.
export async function ensureExerciseDetail(exerciseName) {
  try {
    const allDetails = await getExerciseDetailList();
    const existing = allDetails?.find(d => d.name.toLowerCase() === exerciseName.toLowerCase());
    if (existing?.image_url) {
      return { id: existing.id, image_url: existing.image_url, muscles_worked: existing.muscles_worked, existed: true };
    }
    // No image generation — return empty to fall back to placeholder
    return { id: existing?.id, image_url: '', muscles_worked: existing?.muscles_worked || '', existed: !!existing };
  } catch {
    return { id: null, image_url: '', muscles_worked: '', existed: false };
  }
}