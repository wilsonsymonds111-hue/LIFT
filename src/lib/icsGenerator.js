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
 * The cycle (onDays on, offDays off) is treated as continuous across real
 * calendar days, starting from startDayIndex (Mon=0 ... Sun=6 within the
 * current week). This keeps the exported events consistent with the in-app
 * week strip even though the cycle drifts relative to the 7-day week.
 *
 * @param {string} splitName       e.g. "UPPER / LOWER"
 * @param {Array}  workouts        [{ name: "Upper Body Workout", ... }, ...]
 * @param {number} onDays          consecutive on-days in the cycle
 * @param {number} offDays         consecutive off-days in the cycle
 * @param {number} startDayIndex   Mon=0 ... Sun=6 — the day mapping to cycle pos 0
 * @param {number} daysAhead       how many days of events to generate (default 90)
 * @param {number} workoutHour     hour of day (0-23) for timed events (default 7)
 */
export function generateWorkoutICS({
  splitName = 'Workout',
  workouts = [],
  onDays = 1,
  offDays = 1,
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
  const todayMonSun = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const todayAbs = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000);
  const startAbs = todayAbs - todayMonSun + startDayIndex;
  const cycleLength = onDays + offDays;

  for (let d = 0; d < daysAhead; d++) {
    const offset = (todayAbs + d) - startAbs;
    const pos = ((offset % cycleLength) + cycleLength) % cycleLength;
    if (pos >= onDays) continue; // rest day

    const cycleNum = Math.floor(offset / cycleLength);
    const onDayIdx = cycleNum * onDays + pos;
    const workoutName = workouts[((onDayIdx % workouts.length) + workouts.length) % workouts.length]?.name || `${splitName} Workout`;

    // Timed event: workoutHour → workoutHour + 1
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const startDate = new Date(date);
    startDate.setHours(workoutHour, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(workoutHour + 1, 0, 0, 0);

    const dtStart = toDateTimeUTC(startDate);
    const dtEnd = toDateTimeUTC(endDate);
    const uid = `lift-${d}-${onDayIdx}@lift.app`;

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