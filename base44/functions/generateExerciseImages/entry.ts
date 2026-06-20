import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const ALL_EXERCISES = [
  "Ab Wheel", "Arnold Press (Dumbbell)", "Around the World", "Back Extension", "Back Extension (Machine)",
  "Ball Slams", "Barbell Row", "Battle Ropes", "Bench Press (Barbell)", "Bench Press (Dumbbell)",
  "Bent Over Lateral Raise", "Bicep Curl (Barbell)", "Bicep Curl (Dumbbell)", "Box Jump", "Bradford Press",
  "Bulgarian Split Squat", "Burpee", "Cable Crossover", "Cable Crunch", "Cable Curl",
  "Cable Fly", "Cable Lateral Raise", "Cable Row", "Calf Raise (Machine)", "Chest Dip",
  "Chin Up", "Clean and Press", "Close Grip Bench Press", "Crunch", "Dead Bug",
  "Deadlift (Barbell)", "Decline Bench Press", "Decline Crunch", "Dumbbell Fly", "Face Pull",
  "Farmer's Walk", "Front Raise", "Front Squat", "Glute Bridge", "Goblet Squat",
  "Good Morning", "Hack Squat", "Hammer Curl", "Hang Clean", "Hanging Leg Raise",
  "Hip Thrust (Barbell)", "Hollow Body Hold", "Incline Bench Press (Barbell)", "Incline Bench Press (Dumbbell)", "Incline Curl",
  "Iso-Lateral Row (Machine)", "JM Press", "Jump Squat", "Kettlebell Swing", "L-Sit",
  "Lat Pulldown", "Lateral Raise (Dumbbell)", "Lateral Raise (Machine)", "Leg Curl (Machine)", "Leg Extension (Machine)",
  "Leg Press", "Leg Press Calf Raise", "Lunge (Barbell)", "Lunge (Dumbbell)", "Meadows Row",
  "Mountain Climber", "Nordic Curl", "Overhead Press (Barbell)", "Overhead Press (Dumbbell)", "Overhead Tricep Extension (Dumbbell)",
  "Pallof Press", "Pec Deck (Machine)", "Pendlay Row", "Plank", "Preacher Curl",
  "Pull Up", "Pullover (Machine)", "Push Up", "Rear Delt Fly", "Reverse Curl",
  "Reverse Lunge", "Romanian Deadlift (Barbell)", "Romanian Deadlift (Dumbbell)", "Rope Pushdown", "Russian Twist",
  "Seal Row", "Seated Row (Machine)", "Shrug (Barbell)", "Shrug (Dumbbell)", "Side Lateral Raise",
  "Single Arm Dumbbell Row", "Single Arm Overhead Cable Extension", "Sissy Squat", "Skull Crusher", "Sled Push",
  "Smith Squat", "Spider Curl", "Squat (Barbell)", "Squat (Dumbbell)", "Standing Calf Raise (Machine)",
  "Standing Press", "Step Up", "Straight Arm Pulldown", "Sumo Deadlift", "Svend Press",
  "T-Bar Row", "Thruster", "Trap Bar Deadlift", "Tricep Dip", "Tricep Pushdown (Cable)",
  "Tricep Single Arm Extension", "Turkish Get-Up", "Upright Row", "V-Up", "Wide Grip Pull Up",
  "Wrist Curl", "Zottman Curl"
];

const IMAGE_PROMPT = (name) => `Two side-by-side anatomical figures showing the "${name}" exercise: the left figure shows the starting position, the right figure shows the finishing position. Both figures are identical in size, proportions, camera angle, body composition, and anatomical detail — the only differences are body position and equipment placement. Clean white background. Grayscale anatomical style with visible musculature, no skin texture, like a fitness anatomy reference diagram. All primary and secondary muscles significantly involved in the exercise are highlighted in red, with anatomically accurate activation. Do not highlight muscles not meaningfully contributing. No text, labels, arrows, numbers, logos, watermarks, or annotations. Exercise equipment accurately represented for each phase. Professional museum-quality medical illustration style.`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const existingDetails = await base44.asServiceRole.entities.ExerciseDetail.list('name', 500);
    const existingNames = new Set((existingDetails || []).map(d => d.name));

    // Find exercises that need images (no record at all)
    const needed = ALL_EXERCISES.filter(name => !existingNames.has(name));

    if (needed.length === 0) {
      return Response.json({ message: 'All exercises already have detail records', generated: 0, remaining: 0 });
    }

    // Generate image + instructions for the first exercise that needs it
    const name = needed[0];

    try {
      const [imgRes, llmRes, musclesRes] = await Promise.all([
        base44.asServiceRole.integrations.Core.GenerateImage({ prompt: IMAGE_PROMPT(name) }),
        base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Write 4 short, numbered step-by-step instructions for how to perform the "${name}" exercise at the gym. Keep each step to 1-2 sentences. Be clear and concise. Output format: plain text with each step on a new line starting with the number and a period.`,
        }),
        base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `List the primary and secondary muscle groups worked by the "${name}" exercise. Output as a short comma-separated list only, e.g. "Chest, Front Delts, Triceps". Keep it to 3-5 muscles max.`,
        }),
      ]);

      const image_url = imgRes?.url || '';
      const instructions = typeof llmRes === 'string' ? llmRes : (llmRes?.data || '');
      const muscles_worked = typeof musclesRes === 'string' ? musclesRes : (musclesRes?.data || '');

      const created = await base44.asServiceRole.entities.ExerciseDetail.create({
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