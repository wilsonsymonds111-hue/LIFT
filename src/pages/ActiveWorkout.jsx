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
    const newList = exerciseList.map(ex => {
      const best = snapshot[ex.name];
      if (!best) return ex;
      return { ...ex, history: [...(ex.history || []), { kg: best.kg, reps: best.reps, date: today }] };
    });
    await base44.entities.WorkoutTemplate.update(templateId, {
      exerciseList: newList,
      lastPerformed: new Date().toISOString(),
    });
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