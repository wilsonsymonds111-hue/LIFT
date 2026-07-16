import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALL_EXERCISES = [
  "Ab Wheel Rollouts", "Arnold Press (Dumbbell)", "Back Extension", 
  "Barbell Row",   "Bicep Cable Curl",
  "Bent Over Rear Delt Raises", "Bicep Curl (Barbell)", "Bicep Curl Dumbbell Supinated", ,
  "Bulgarian Split Squat (Dumbbell)",  "Cable Crunch",  "Seated Calf Raise", "Chest Dip",
  "Chin Up", "Clean and Press", "Close Grip Smith Chest Press", "Crunch",
  "Deadlift (Barbell)", "Decline Crunch", "Dumbbell Fly", "Face Pull",
   "Front Raise Isolateral (Dumbbell)", "Front Squat (Barbell)", "Goblet Squat",
  "Hack Squat",   "Hammer Curl", "Hanging Leg Raise",
  "Hip Thrust (Barbell)", "Incline Bench Press (Barbell)", "Incline Dumbbell Press", "Incline Curl",
  "Row Machine",   "Kettlebell Swing", "L-Sit",
  "Lat Pulldown", "Lateral Raise (Machine)", "Leg Extension (Machine)",
  "Leg Press", "Leg Press Calf Raise", "Lunge (Barbell)", "Lunge (Dumbbell)", "Meadows Row",
  "Mountain Climber", "Nordic Curl", "Overhead Press (Barbell)", "Overhead Press (Dumbbell)", "Overhead Tricep Extension (Dumbbell)",
  "Pallof Press", "Pec Deck (Machine)", "Pendlay Row", "Plank", "Preacher Curl",
  "Pull Up", "Pullover (Machine)", "Push Up", "Rear Delt Fly", "Reverse Curl",
  "Reverse Lunge", "Romanian Deadlift (Barbell)", "Romanian Deadlift (Dumbbell)", "Rope Pushdown", "Russian Twist",
  "Seal Row", "Seated Cable Row", "Shrug (Barbell)", "Shrug (Dumbbell)",
  "Single Arm Dumbbell Row", "Single Arm Overhead Cable Extension",   "Sissy Squat", "Skull Crushers (Ezy Bar)", "Sled Push",
  "Smith Machine Squat", "Spider Curl", "Squat (Barbell)", "Squat (Dumbbell)", "Standing Calf Raise (Machine)",
  "Standing Press", "Step Up", "Straight Arm Pulldown", "Sumo Deadlift", "Svend Press",
  "T-Bar Row", "Thruster", "Trap Bar Deadlift", "Tricep Dip", "Tricep Pushdown (Cable)",
  "Tricep Single Arm Extension", "Turkish Get-Up", "Upright Row", "V-Up", "Wide Grip Pull Up",
  "Wrist Curl", "Zottman Curl"
];

const IMAGE_PROMPT = (name, muscles) => `Two side-by-side anatomical figures showing the "${name}" exercise: the left figure shows the starting position, the right figure shows the finishing position. Both figures are identical in size, proportions, camera angle, body composition, and anatomical detail. Clean white background. Grayscale anatomical style with visible musculature, no skin texture, like a fitness anatomy reference diagram. ONLY the following muscles must be highlighted in red: ${muscles}. No other muscles should be red. No text, labels, arrows, numbers, logos, watermarks, or annotations. Exercise equipment accurately represented for each phase. Professional museum-quality medical illustration style.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existingDetails = await base44.asServiceRole.entities.ExerciseDetail.list('name', 500);
    const existingWithImages = new Set(
      (existingDetails || []).filter(d => d.image_url).map(d => d.name)
    );

    // NEVER overwrite an exercise that already has an image.
    // This is a hard safeguard — user-uploaded or previously generated
    // images must be preserved at all costs.
    const needed = ALL_EXERCISES.filter(name => !existingWithImages.has(name));

    if (needed.length === 0) {
      return Response.json({ message: 'All exercises already have detail records', generated: 0, remaining: 0 });
    }

    const name = needed[0];

    try {
      // First determine the muscles for this exercise
      const musclesRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `List the primary and secondary muscle groups worked by the "${name}" exercise. Output ONLY a comma-separated list, e.g. "Chest, Front Delts, Triceps". Keep it to 3-5 muscles max. No other text.`,
      });
      const muscles_worked = typeof musclesRes === 'string' ? musclesRes.trim() : (musclesRes?.data || '').trim();

      // Then generate image and instructions in parallel, using the specific muscles in the image prompt
      const [imgRes, llmRes] = await Promise.all([
        base44.asServiceRole.integrations.Core.GenerateImage({ prompt: IMAGE_PROMPT(name, muscles_worked) }),
        base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Write 4 short, numbered step-by-step instructions for how to perform the "${name}" exercise at the gym. Keep each step to 1-2 sentences. Be clear and concise. Output format: plain text with each step on a new line starting with the number and a period.`,
        }),
      ]);

      const image_url = imgRes?.url || '';
      const instructions = typeof llmRes === 'string' ? llmRes : (llmRes?.data || '');

      await base44.asServiceRole.entities.ExerciseDetail.create({
        name,
        image_url,
        instructions,
        muscles_worked,
      });

      return Response.json({
        generated: name,
        image_url,
        instructions,
        muscles_worked,
        remaining: needed.length - 1,
      });
    } catch (e) {
      return Response.json({ error: `Failed to generate for ${name}: ${e.message}`, remaining: needed.length });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});