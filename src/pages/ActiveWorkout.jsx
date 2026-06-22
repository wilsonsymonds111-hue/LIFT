import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { saveWorkout, syncOfflineQueue } from '../lib/offlineQueue';
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
    base44.entities.WorkoutTemplate.get(id).then(t => {
      if (t) setTemplate(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleSaveHistory = async (templateId, snapshot, exerciseList) => {
    if (templateId.startsWith('empty-')) return;
    await saveWorkout(templateId, snapshot, exerciseList);
  };

  // Sync any queued workouts when back online
  useEffect(() => {
    const onOnline = () => { syncOfflineQueue(); };
    window.addEventListener('online', onOnline);
    if (navigator.onLine) { syncOfflineQueue(); }
    return () => window.removeEventListener('online', onOnline);
  }, []);

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