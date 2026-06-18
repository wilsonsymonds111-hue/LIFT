import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import WorkoutSheet from '../components/WorkoutSheet';

export default function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Empty workout
    if (id.startsWith('empty-')) {
      setTemplate({ id, name: 'Evening Workout', exerciseList: [] });
      setLoading(false);
      return;
    }
    base44.entities.WorkoutTemplate.list('sort_order', 200).then(results => {
      const found = results?.find(t => t.id === id);
      if (found) setTemplate(found);
      setLoading(false);
    });
  }, [id]);

  const handleSaveHistory = async (templateId, snapshot, exerciseList) => {
    if (templateId.startsWith('empty-')) return;
    const today = new Date().toISOString().slice(0, 10);

    // Build map of existing Exercise entities
    const allExercises = await base44.entities.Exercise.list('name', 500);
    const exerciseMap = {};
    (allExercises || []).forEach(ex => { exerciseMap[ex.name] = ex; });

    // Save history to the Exercise entity (shared across all splits)
    const exerciseSaves = exerciseList
      .filter(ex => snapshot[ex.name])
      .map(async (ex) => {
        const best = snapshot[ex.name];
        const entry = { kg: best.kg, reps: best.reps, date: today };
        try {
          const existing = exerciseMap[ex.name];
          if (existing) {
            await base44.entities.Exercise.update(existing.id, {
              history: [...(existing.history || []), entry],
              muscle: ex.muscle || existing.muscle,
            });
          } else {
            await base44.entities.Exercise.create({
              name: ex.name,
              muscle: ex.muscle || '',
              history: [entry],
            });
          }
        } catch (e) {
          console.error('Failed to save exercise history:', ex.name, e);
        }
      });

    // Update template lastPerformed
    try {
      await base44.entities.WorkoutTemplate.update(templateId, {
        lastPerformed: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Failed to save workout:', e);
    }

    await Promise.all(exerciseSaves);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WorkoutSheet
      key={template?.id}
      template={template}
      onFinish={() => navigate('/', { replace: true })}
      onSaveHistory={handleSaveHistory}
    />
  );
}