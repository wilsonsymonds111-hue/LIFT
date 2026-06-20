import { base44 } from '@/api/base44Client';

// Ensures an ExerciseDetail record exists for the given exercise name.
// If one already exists, returns its image_url. If not, generates one via AI and persists it.
export async function ensureExerciseDetail(exerciseName) {
  try {
    const results = await base44.entities.ExerciseDetail.filter({ name: exerciseName });
    if (results?.length > 0 && results[0].image_url) {
      return { image_url: results[0].image_url, muscles_worked: results[0].muscles_worked, existed: true };
    }

    // Generate — first get muscles, then image
    const musclesRes = await base44.integrations.Core.InvokeLLM({
      prompt: `List the primary and secondary muscle groups worked by the "${exerciseName}" exercise. Output ONLY a comma-separated list, e.g. "Chest, Front Delts, Triceps". Keep it to 3-5 muscles max. No other text.`,
    });
    const muscles_worked = (musclesRes?.data || musclesRes || '').trim();

    const imgRes = await base44.integrations.Core.GenerateImage({
      prompt: `Two side-by-side anatomical figures showing the "${exerciseName}" exercise: the left figure shows the starting position, the right figure shows the finishing position. Both figures are identical in size, proportions, camera angle, body composition, and anatomical detail. Clean white background. Grayscale anatomical style with visible musculature, no skin texture, like a fitness anatomy reference diagram. ONLY the following muscles must be highlighted in red: ${muscles_worked}. No other muscles should be red. No text, labels, arrows, numbers, logos, watermarks, or annotations. Exercise equipment accurately represented for each phase. Professional museum-quality medical illustration style.`,
    }).catch(() => ({ url: '' }));

    const image_url = imgRes?.url || '';

    if (results?.length > 0) {
      // Update existing record that had no image
      await base44.entities.ExerciseDetail.update(results[0].id, { image_url, muscles_worked });
      return { image_url, existed: true };
    }

    // Create new record
    await base44.entities.ExerciseDetail.create({
      name: exerciseName,
      instructions: '',
      image_url,
      muscles_worked,
    });
    return { image_url, muscles_worked, existed: false };
  } catch {
    return { image_url: '', muscles_worked: '', existed: false };
  }
}