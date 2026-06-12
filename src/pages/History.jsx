import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  const date = isDateOnly ? new Date(dateStr + 'T00:00:00') : new Date(dateStr);
  return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

export default function History() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.WorkoutTemplate.list('sort_order', 100).then(data => {
      if (data) setTemplates(data);
      setLoading(false);
    });
  }, []);

  // Build a flat list of performed sessions sorted by date desc
  const sessions = templates
    .filter(t => t.lastPerformed)
    .sort((a, b) => new Date(b.lastPerformed) - new Date(a.lastPerformed));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top))', paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
      <div className="px-4 pb-3">
        <h1 className="text-3xl font-extrabold text-foreground leading-tight">History</h1>
      </div>

      <div className="px-4 pb-6">
        {sessions.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-3">🏋️</p>
            <p className="text-lg font-medium mb-1">No workouts yet</p>
            <p className="text-sm">Complete a workout to see your history here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map(t => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-foreground">{t.name}</h3>
                  <span className="text-xs text-muted-foreground">{formatDate(t.lastPerformed)}</span>
                </div>
                {t.exerciseList?.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t.exerciseList.map(e => e.name).join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}