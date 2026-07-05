// Maps exercise names to default rest durations (in seconds)
// Compound lifts: 180s (3 min), isolation: 120s (2 min), default: 120s

const COMPOUND_KEYWORDS = [
  'squat', 'deadlift', 'bench press', 'overhead press', 'standing press',
  'barbell row', 'pendlay row', 't-bar row', 'cable row', 'seated row',
  'meadows row', 'seal row', 'single arm dumbbell row', 'iso-lateral row',
  'pull up', 'chin up', 'wide grip pull up',
  'chest dip', 'tricep dip',
  'leg press', 'hip thrust', 'glute bridge',
  'lunge', 'step up', 'reverse lunge',
  'good morning',
  'clean', 'thruster', 'push press',
  'hang clean', 'clean and press',
  'bulgarian split squat',
  'goblet squat',
  'front squat', 'hack squat', 'smith squat', 'smith machine squat',
  'romanian deadlift',
  'sumo deadlift',
  'trap bar deadlift',
  'incline bench press', 'decline bench press',
  'close grip bench press', 'close grip smith chest press',
  'chest press', 'barbell press',
  'lat pulldown',
  'upright row',
  'arnold press',
  'nordic curl',
  'sissy squat',
  'sled push',
];

export function getDefaultRestDuration(exerciseName) {
  if (!exerciseName) return 120;
  const lower = exerciseName.toLowerCase();
  const isCompound = COMPOUND_KEYWORDS.some(kw => lower.includes(kw));
  return isCompound ? 180 : 120;
}