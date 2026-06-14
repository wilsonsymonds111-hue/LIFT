import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { EXAMPLE_SPLITS_DATA } from '../lib/splitData';

function relativeTime(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  if (diffMs < 60000) return 'Just now';
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function SplitDetail() {
  const { key } = useParams();
  const navigate = useNavigate();
  const [applying, setApplying] = useState(false);
  const [customSplit, setCustomSplit] = useState(null);
  const [loading, setLoading] = useState(false);

  const exampleSplit = EXAMPLE_SPLITS_DATA[key];

  // If not an example split, load custom split from database
  useEffect(() => {
    if (!exampleSplit && key) {
      setLoading(true);
      base44.entities.WorkoutTemplate.list('sort_order', 100).then(data => {
        const templates = (data || []).filter(t => t.splitGroup === key);
        if (templates.length > 0) {
          setCustomSplit({
            name: templates.map(t => t.name.replace(/ Workout$/, '').replace(/(?<!Full) Body$/, '')).join(' / ').toUpperCase(),
            description: `${templates.length} workout${templates.length > 1 ? 's' : ''}`,
            workouts: templates.map(t => ({
              name: t.name,
              exercisesText: t.exercises || (t.exerciseList || []).map(e => e.name).join(', '),
              exerciseCount: (t.exerciseList || []).length,
              lastPerformed: t.lastPerformed,
              exercises: (t.exerciseList || []).map(e => ({ name: e.name })),
              templateId: t.id,
            })),
          });
        }
        setLoading(false);
      });
    }
  }, [key, exampleSplit]);

  const split = exampleSplit || customSplit;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!split) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Split not found</p>
        <button onClick={() => navigate(-1)} className="text-blue-500 font-semibold">Go back</button>
      </div>
    );
  }

  const handleMakeCurrent = async () => {
    setApplying(true);
    const newGroupId = Date.now().toString();
    const oldGroupId = Date.now().toString() + '_old';
    try {
      const allTemplates = await base44.entities.WorkoutTemplate.list('sort_order', 100);
      const currentActive = allTemplates.filter(
        t => t.isActiveSplit === true || (!t.splitGroup || t.splitGroup === '')
      );
      await Promise.all(currentActive.map(t =>
        base44.entities.WorkoutTemplate.update(t.id, { isActiveSplit: false, splitGroup: oldGroupId })
      ));
      const newTemplates = split.workouts.map((w, i) => ({
        name: w.name,
        exercises: (w.exercises || []).map(e => e.name).join(', '),
        exerciseList: (w.exercises || []).map(e => ({ ...e, history: [] })),
        lastPerformed: null,
        sort_order: i,
        isActiveSplit: true,
        splitGroup: newGroupId,
      }));
      await base44.entities.WorkoutTemplate.bulkCreate(newTemplates);
    } catch (_) {}
    setApplying(false);
    navigate('/');
  };

  const handleViewWorkout = async (workout) => {
    // For custom splits, use the existing template
    if (workout.templateId) {
      navigate(`/template/${workout.templateId}`);
      return;
    }
    // For example splits, create the template first
    setApplying(true);
    const exerciseList = workout.exercises.map(e => ({ ...e, history: [] }));
    const exercisesStr = workout.exercises.map(e => e.name).join(', ');
    const template = await base44.entities.WorkoutTemplate.create({
      name: workout.name,
      exercises: exercisesStr,
      exerciseList,
      lastPerformed: null,
      isActiveSplit: false,
      splitGroup: key,
    });
    setApplying(false);
    navigate(`/template/${template.id}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition -ml-2"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-extrabold text-foreground">{split.name}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{split.description}</p>
        </div>
        <div className="w-11" />
      </div>

      <div className="flex flex-col gap-3 px-5 pt-5">
        {split.workouts.map((workout, idx) => (
          <div
            key={idx}
            onClick={() => handleViewWorkout(workout)}
            className="relative bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 shadow-md shadow-amber-100/60 dark:shadow-amber-900/20 ring-1 ring-amber-200/50 dark:ring-amber-800/20 hover:shadow-lg hover:scale-[1.02] transition-all duration-150 cursor-pointer"
          >
            <h4 className="font-bold text-foreground pr-8">{workout.name}</h4>
            <p className="text-sm text-muted-foreground my-3 line-clamp-2">
              {workout.exercisesText || (workout.exercises || []).map(e => e.name).join(', ')}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              ⏱ {workout.lastPerformed ? relativeTime(workout.lastPerformed) : 'Not yet performed'}
            </p>
          </div>
        ))}
      </div>

      <div className="px-5 pt-4">
        <button
          onClick={handleMakeCurrent}
          disabled={applying}
          className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-60"
        >
          {applying ? 'Applying...' : 'Make This My Current Split'}
        </button>
      </div>
    </div>
  );
}