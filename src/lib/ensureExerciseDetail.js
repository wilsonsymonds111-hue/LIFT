import { base44 } from '@/api/base44Client';

// Returns an ExerciseDetail record for the given exercise name if one exists.
// No longer generates AI images — images must be uploaded by the user.
export async function ensureExerciseDetail(exerciseName) {
  try {
    const allDetails = await base44.entities.ExerciseDetail.list('name', 500);
    const existing = allDetails?.find(d => d.name.toLowerCase() === exerciseName.toLowerCase());
    if (existing?.image_url) {
      return { image_url: existing.image_url, muscles_worked: existing.muscles_worked, existed: true };
    }
    // No image generation — return empty to fall back to placeholder
    return { image_url: '', muscles_worked: existing?.muscles_worked || '', existed: !!existing };
  } catch {
    return { image_url: '', muscles_worked: '', existed: false };
  }
}