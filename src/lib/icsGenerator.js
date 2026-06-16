/* ─── ICS calendar file generator for workout splits ─────────── */

function pad(n) {
  return String(n).padStart(2, '0');
}

function toDateTimeUTC(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

/**
 * Generate an ICS string from a workout split schedule.
 *
 * @param {string} splitName       e.g. "UPPER / LOWER"
 * @param {Array}  workouts        [{ name: "Upper Body Workout", ... }, ...]
 * @param {Array}  schedule        7-day monSun schedule [1,0,1,...], pre-rotated
 * @param {number} startDayIndex   Mon=0 ... Sun=6 — the day mapping to cycle pos 0
 * @param {number} daysAhead       how many days of events to generate (default 90)
 * @param {number} workoutHour     hour of day (0-23) for timed events (default 7)
 */
export function generateWorkoutICS({
  splitName = 'Workout',
  workouts = [],
  schedule = [],
  startDayIndex = 0,
  daysAhead = 90,
  workoutHour = 7,
}) {
  const lines = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//LIFT//Workout Calendar//EN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:LIFT Workouts');
  lines.push('X-WR-TIMEZONE:' + (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count the number of consecutive on-days from startDayIndex to determine cycle length
  let onDays = 0, offDays = 0, counting = true;
  for (let i = 0; i < 7; i++) {
    const idx = (startDayIndex + i) % 7;
    if (schedule[idx] >= 1) {
      if (counting) onDays++; else break;
    } else {
      if (counting) { counting = false; offDays = 1; }
      else if (schedule[idx] < 1) offDays++; else break;
    }
  }
  const cycleLength = onDays + offDays;

  for (let d = 0; d < daysAhead; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dayOfWeek = date.getDay(); // 0=Sun
    const monSun = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // schedule is already a 7-day monSun-indexed array — check directly
    if ((schedule[monSun] || 0) < 1) continue; // rest day

    // Compute which on-day this is within the cycle to pick the right workout
    const cyclePos = ((monSun - startDayIndex) % cycleLength + cycleLength) % cycleLength;
    // Count how many on-days appear before this position in the cycle
    let onDayIdx = 0;
    for (let p = 0; p < cyclePos; p++) {
      const checkIdx = (startDayIndex + p) % 7;
      if ((schedule[checkIdx] || 0) >= 1) onDayIdx++;
    }
    const workoutName = workouts[onDayIdx % workouts.length]?.name || `${splitName} Workout`;

    // Timed event: workoutHour → workoutHour + 1
    const startDate = new Date(date);
    startDate.setHours(workoutHour, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(workoutHour + 1, 0, 0, 0);

    const dtStart = toDateTimeUTC(startDate);
    const dtEnd = toDateTimeUTC(endDate);
    const uid = `lift-${d}-${monSun}-${onDayIdx}@lift.app`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${workoutName} 🏋️`);
    lines.push(`DESCRIPTION:${splitName} — Workout day`);
    lines.push(`DTSTAMP:${toDateTimeUTC(new Date())}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}