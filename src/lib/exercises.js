export const ALL_EXERCISES = [
  { name: 'Ab Wheel Rollouts', muscle: 'Core' },
  { name: 'Arnold Press (Dumbbell)', muscle: 'Shoulders' },
  { name: 'Back Extension', muscle: 'Back' },
  { name: 'Barbell Row', muscle: 'Back' },
  { name: 'Flat Barbell Bench Press', muscle: 'Chest' },
  { name: 'Bicep Curl (Barbell)', muscle: 'Arms' },
  { name: 'Bicep Curl Dumbbell Supinated', muscle: 'Arms' },
  { name: 'Bulgarian Split Squat (Dumbbell)', muscle: 'Legs' },
  { name: 'Cable Crunch', muscle: 'Core' },
  { name: 'Bicep Cable Curl', muscle: 'Arms' },
  { name: 'Cable Chest Fly (Standing)', muscle: 'Chest' },
  { name: 'Side Cable Lateral Raise', muscle: 'Shoulders' },

  { name: 'Chest Dip', muscle: 'Chest' },
  { name: 'Chin Up', muscle: 'Back' },
  { name: 'Clean and Press', muscle: 'Full Body' },
  { name: 'Close Grip Smith Chest Press', muscle: 'Chest' },
  { name: 'Crunch', muscle: 'Core' },
  { name: 'Deadlift (Barbell)', muscle: 'Back' },
  { name: 'Decline Crunch', muscle: 'Core' },
  { name: 'Flat Dumbbell Chest Press', muscle: 'Chest' },
  { name: 'Dumbbell Fly', muscle: 'Chest' },
  { name: 'Face Pull', muscle: 'Shoulders' },
  { name: 'Front Raise Isolateral (Dumbbell)', muscle: 'Shoulders' },
  { name: 'Front Squat (Barbell)', muscle: 'Legs' },
  { name: 'Glute Cable Kickback', muscle: 'Legs' },
  { name: 'Goblet Squat', muscle: 'Legs' },
  { name: 'Hack Squat', muscle: 'Legs' },
  { name: 'Hammer Curl', muscle: 'Arms' },
  { name: 'Hanging Leg Raise', muscle: 'Core' },
  { name: 'Hip Thrust (Barbell)', muscle: 'Legs' },
  { name: 'Incline Barbell Press', muscle: 'Chest' },
  { name: 'Incline Smith Chest Press', muscle: 'Chest' },
  { name: 'Incline Curl', muscle: 'Arms' },
  { name: 'Row Machine', muscle: 'Back' },

  { name: 'Kettlebell Swing', muscle: 'Full Body' },

  { name: 'Lat Pulldown', muscle: 'Back' },

  { name: 'Lateral Raise (Machine)', muscle: 'Shoulders' },
  { name: 'Lying Hamstring Curl', muscle: 'Legs' },
  { name: 'Seated Hamstring Curl', muscle: 'Legs' },
  { name: 'Leg Extension (Machine)', muscle: 'Legs' },
  { name: 'Leg Press', muscle: 'Legs' },

  { name: 'Machine Chest Fly', muscle: 'Chest' },



  { name: 'Overhead Press (Barbell)', muscle: 'Shoulders' },
  { name: 'Overhead Press (Dumbbell)', muscle: 'Shoulders' },
  { name: 'Overhead Tricep Extension (Dumbbell)', muscle: 'Arms' },

  { name: 'Preacher Curl (Machine)', muscle: 'Arms' },
  { name: 'Pull Up', muscle: 'Back' },

  { name: 'Push Up', muscle: 'Chest' },
  { name: 'Rear Delt Fly Machine', muscle: 'Shoulders' },
  { name: 'Romanian Deadlift (Barbell)', muscle: 'Legs' },
  { name: 'Romanian Deadlift (Dumbbell)', muscle: 'Legs' },
  { name: 'Seated Cable Row', muscle: 'Back' },
  { name: 'Shrug (Dumbbell)', muscle: 'Shoulders' },

  { name: 'Sissy Squat', muscle: 'Legs' },
  { name: 'Skull Crushers (Ezy Bar)', muscle: 'Arms' },
  { name: 'Sled Push', muscle: 'Full Body' },
  { name: 'Smith Machine Squat', muscle: 'Legs' },
  { name: 'Spider Curl', muscle: 'Arms' },
  { name: 'Squat (Barbell)', muscle: 'Legs' },
  { name: 'Squat (Dumbbell)', muscle: 'Legs' },
  { name: 'Standing Calf Raise (Machine)', muscle: 'Legs' },
  { name: 'Standing Chest Press', muscle: 'Chest' },
  { name: 'Standing Press', muscle: 'Shoulders' },
  { name: 'Step Up', muscle: 'Legs' },
  { name: 'Straight Arm Pulldown', muscle: 'Back' },
  { name: 'Sumo Deadlift', muscle: 'Legs' },
  { name: 'T-Bar Row', muscle: 'Back' },
  { name: 'Thruster', muscle: 'Full Body' },
  { name: 'Trap Bar Deadlift', muscle: 'Legs' },
  { name: 'Tricep Pushdown (Cable)', muscle: 'Arms' },
  { name: 'Tricep Single Arm Extension', muscle: 'Arms' },
  { name: 'Turkish Get-Up', muscle: 'Full Body' },
  { name: 'Upright Row', muscle: 'Shoulders' },
  { name: 'V-Up', muscle: 'Core' },
  { name: 'Wide Grip Pull Up', muscle: 'Back' },
  { name: 'Wrist Curl', muscle: 'Arms' },
  { name: 'Zottman Curl', muscle: 'Arms' },
];

// Alternate names users might search by → canonical exercise name (lowercase).
export const EXERCISE_ALIASES = {
  'military press': 'Overhead Press (Barbell)',
  'rdl': 'Romanian Deadlift (Dumbbell)',
};

export const MUSCLES = ['All', 'Arms', 'Back', 'Chest', 'Core', 'Full Body', 'Legs', 'Shoulders'];

export const MUSCLE_COLORS = {
  'Arms': { bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600 dark:text-rose-400' },
  'Back': { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400' },
  'Chest': { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-500 dark:text-blue-400' },
  'Core': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600 dark:text-emerald-400' },
  'Full Body': { bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600 dark:text-violet-400' },
  'Legs': { bg: 'bg-orange-50 dark:bg-orange-950/30', text: 'text-orange-600 dark:text-orange-400' },
  'Shoulders': { bg: 'bg-cyan-50 dark:bg-cyan-950/30', text: 'text-cyan-600 dark:text-cyan-400' },
};