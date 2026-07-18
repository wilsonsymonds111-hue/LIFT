// Computes how many consecutive days (ending today) the user followed their
// calendar schedule. "Followed" means:
//   - Workout day → a workout was logged that day
//   - Rest day   → NO workout was logged that day (resting is the win)
// Today is treated as in-progress: an unfinished workout day doesn't break the
// streak (the day isn't over), but working out on a scheduled rest day does.

function absTodayUTC() {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
}

function dateStrFromAbs(absDay) {
  const d = new Date(absDay * 86400000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function computeScheduleStreak({ workoutDates, onDays, offDays, startDayIndex }) {
  if (!onDays || !offDays || onDays < 1) return 0;

  const cycleLength = onDays + offDays;
  const now = new Date();
  const todayMonSun = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const todayAbs = absTodayUTC();
  const startAbs = todayAbs - todayMonSun + startDayIndex;

  const isWorkoutDay = (absDay) => {
    const offset = absDay - startAbs;
    const pos = ((offset % cycleLength) + cycleLength) % cycleLength;
    return pos < onDays;
  };

  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const absDay = todayAbs - i;
    const isWorkout = isWorkoutDay(absDay);
    const didWorkout = workoutDates.has(dateStrFromAbs(absDay));

    if (i === 0) {
      // Today is in-progress: an unfinished workout day doesn't break the streak.
      if (isWorkout && !didWorkout) continue;
      if (!isWorkout && didWorkout) break; // worked out through a rest day
      streak++;
    } else {
      if (isWorkout ? didWorkout : !didWorkout) {
        streak++;
      } else {
        break;
      }
    }
  }
  return streak;
}