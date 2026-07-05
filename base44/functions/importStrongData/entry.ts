import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'No file URL provided' }, { status: 400 });

    const resp = await fetch(file_url);
    if (!resp.ok) return Response.json({ error: 'Failed to download CSV file' }, { status: 400 });
    const csv = await resp.text();

    const rows = parseCSV(csv);
    if (rows.length < 2) return Response.json({ error: 'Empty CSV file' }, { status: 400 });

    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dateIdx = headers.findIndex(h => h.includes('date'));
    const workoutIdx = headers.findIndex(h => h.includes('workout name') || h === 'workout');
    const exerciseIdx = headers.findIndex(h => h.includes('exercise name') || h === 'exercise');
    const weightIdx = headers.findIndex(h => h.includes('weight'));
    const repsIdx = headers.findIndex(h => h.includes('reps'));

    if (workoutIdx === -1 || exerciseIdx === -1) {
      return Response.json({
        error: "This doesn't look like a Strong CSV export. Expected columns: Workout Name, Exercise Name, Weight, Reps."
      }, { status: 400 });
    }

    // Group data
    const workouts = {};       // workoutName -> { lastDate, exercises: {}, sessions: {} }
    const exerciseHistory = {}; // exerciseName -> [{ kg, reps, date }]

    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i];
      const rawDate = (cols[dateIdx] || '').trim();
      const date = rawDate.split(' ')[0].split('T')[0];
      const workoutName = (cols[workoutIdx] || '').trim();
      const exerciseName = (cols[exerciseIdx] || '').trim();
      const weight = parseFloat(cols[weightIdx]) || 0;
      const reps = parseInt(cols[repsIdx]) || 0;

      if (!workoutName || !exerciseName) continue;

      // Exercise history (all-time)
      if (!exerciseHistory[exerciseName]) exerciseHistory[exerciseName] = [];
      exerciseHistory[exerciseName].push({ kg: weight, reps, date });

      // Workout structure
      if (!workouts[workoutName]) {
        workouts[workoutName] = { lastDate: '', exercises: {}, sessions: {} };
      }
      if (!workouts[workoutName].exercises[exerciseName]) {
        workouts[workoutName].exercises[exerciseName] = { name: exerciseName };
      }

      // Track sets per session (to determine typical set count)
      if (!workouts[workoutName].sessions[date]) workouts[workoutName].sessions[date] = {};
      if (!workouts[workoutName].sessions[date][exerciseName]) {
        workouts[workoutName].sessions[date][exerciseName] = 0;
      }
      workouts[workoutName].sessions[date][exerciseName]++;

      if (date > workouts[workoutName].lastDate) workouts[workoutName].lastDate = date;
    }

    // Build templates — exerciseList stores only name + sets (history lives in Exercise entities)
    const templatesToCreate = Object.entries(workouts).map(([workoutName, w], idx) => {
      const lastSession = w.sessions[w.lastDate] || {};
      const exerciseList = Object.values(w.exercises).map(e => ({
        name: e.name,
        sets: lastSession[e.name] || 3,
      }));
      return {
        name: workoutName,
        exerciseList,
        lastPerformed: w.lastDate,
        sort_order: idx,
      };
    });

    // Build exercise entities with sorted history
    const exercisesToCreate = Object.entries(exerciseHistory).map(([name, history]) => ({
      name,
      history: history.sort((a, b) => new Date(a.date) - new Date(b.date)),
    }));

    let templatesCreated = 0;
    let exercisesCreated = 0;

    // Create templates one at a time to avoid payload limits
    for (const tpl of templatesToCreate) {
      try {
        await base44.entities.WorkoutTemplate.create(tpl);
        templatesCreated++;
      } catch (e) {
        console.error('Failed to create template:', tpl.name, e.message);
      }
    }

    // Create exercises in small batches to stay within payload limits
    for (let i = 0; i < exercisesToCreate.length; i += 10) {
      const batch = exercisesToCreate.slice(i, i + 10);
      try {
        await base44.entities.Exercise.bulkCreate(batch);
        exercisesCreated += batch.length;
      } catch (e) {
        console.error('Exercise batch failed, trying individually:', e.message);
        for (const ex of batch) {
          try {
            await base44.entities.Exercise.create(ex);
            exercisesCreated++;
          } catch (e2) {
            console.error('Failed to create exercise:', ex.name, e2.message);
          }
        }
      }
    }

    return Response.json({
      success: true,
      workoutsImported: templatesCreated,
      exercisesImported: exercisesCreated,
      totalSets: rows.length - 1
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Robust CSV parser — handles quoted fields, embedded commas, and multi-line notes
function parseCSV(text) {
  const rows = [];
  let row = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' && !inQuotes) {
      row.push(current.trim());
      current = '';
      if (row.some(c => c !== '')) rows.push(row);
      row = [];
    } else if (char === '\r') {
      // skip carriage returns
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current !== '' || row.length > 0) {
    row.push(current.trim());
    if (row.some(c => c !== '')) rows.push(row);
  }
  return rows;
}