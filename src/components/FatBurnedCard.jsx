import { useState, useEffect, useMemo, useCallback } from 'react';
import { Flame, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import { calculateCutResults, est1RM, isCompoundLift } from '@/lib/muscleMassModel';

const CACHE_KEY = 'fatLossPrediction_v1';
const CACHE_TTL = 6 * 60 * 60 * 1000;

export default function FatBurnedCard({ cutStartDate }) {
  const { user } = useAuth();
  const { data: templates = [] } = useWorkoutTemplates();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const splitExerciseNames = useMemo(() => {
    const names = new Set();
    const active = (templates || []).filter(t => t.isActiveSplit === true);
    active.forEach(t => {
      (t.exerciseList || []).forEach(e => { if (e.name) names.add(e.name); });
    });
    return [...names];
  }, [templates]);

  const compute = useCallback(async () => {
    if (!cutStartDate) {
      setResult(null);
      setLoading(false);
      return;
    }

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && cached.date === cutStartDate && Date.now() - cached.timestamp < CACHE_TTL) {
        setResult(cached.data);
        setLoading(false);
        return;
      }
    } catch {}

    if (splitExerciseNames.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const cutDate = new Date(cutStartDate + 'T00:00:00');

      const weightEntries = await base44.entities.BodyWeight.list('date', 200);
      const cutWeights = weightEntries
        .filter(e => new Date(e.date + 'T00:00:00') >= cutDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      if (cutWeights.length < 2) {
        setLoading(false);
        return;
      }

      const allExercises = await base44.entities.Exercise.list('name', 200);
      const splitExercises = (allExercises || []).filter(
        e => splitExerciseNames.includes(e.name) && e.history && e.history.length > 0
      );

      const startingWeight = cutWeights[0].weight;
      const currentWeight = cutWeights[cutWeights.length - 1].weight;
      const lastDate = new Date(cutWeights[cutWeights.length - 1].date + 'T00:00:00');
      const weeksCut = Math.max(1, Math.round((lastDate - cutDate) / (7 * 24 * 60 * 60 * 1000)));

      const workoutDates = new Set();
      splitExercises.forEach(ex => {
        (ex.history || []).forEach(h => {
          if (h.date && new Date(h.date) >= cutDate) {
            workoutDates.add(h.date.slice(0, 10));
          }
        });
      });
      const sessionsPerWeek = weeksCut > 0 ? workoutDates.size / weeksCut : 0;

      const exercisesData = splitExercises.map(ex => {
        const cutHistory = (ex.history || [])
          .filter(h => h.date && new Date(h.date) >= cutDate)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        if (cutHistory.length === 0) return null;
        const first = cutHistory[0];
        const latest = cutHistory[cutHistory.length - 1];
        const starting1RM = est1RM(first?.kg, first?.reps);
        const latest1RM = est1RM(latest?.kg, latest?.reps);
        const percentIncrease = (starting1RM && starting1RM > 0)
          ? (latest1RM - starting1RM) / starting1RM : 0;
        return {
          name: ex.name,
          isCompound: isCompoundLift(ex.name),
          percentIncrease,
        };
      }).filter(Boolean);

      const res = calculateCutResults({
        startingWeight,
        currentWeight,
        weeksCut,
        exercises: exercisesData,
        sessionsPerWeek,
        targetSessionsPerWeek: 4,
      });

      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: res, date: cutStartDate, timestamp: Date.now() }));
      setResult(res);
    } catch (e) {
      console.error('Fat loss calculation failed:', e);
    }
    setLoading(false);
  }, [cutStartDate, splitExerciseNames]);

  useEffect(() => { compute(); }, [compute]);

  // Invalidate cache when entries change
  useEffect(() => {
    const handler = () => { localStorage.removeItem(CACHE_KEY); compute(); };
    window.addEventListener('bodyWeightChanged', handler);
    return () => window.removeEventListener('bodyWeightChanged', handler);
  }, [compute]);

  if (!cutStartDate) {
    return (
      <div className="bg-white dark:bg-card rounded-2xl p-4 border border-gray-200 dark:border-border shadow-sm">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-lg font-semibold text-gray-900 dark:text-foreground">Fat Burned</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-muted-foreground mt-2">
          Tap a point on your chart to set your cut start date.
        </p>
      </div>
    );
  }

  const fatLostKg = result ? (result.fatLostG / 1000).toFixed(1) : '0.0';

  return (
    <div className="bg-white dark:bg-card rounded-2xl p-4 border border-gray-200 dark:border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="text-lg font-semibold text-gray-900 dark:text-foreground">Fat Burned</span>
        </div>
        <button onClick={() => setShowInfo(!showInfo)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-muted transition">
          <Info className="w-4 h-4 text-gray-400 dark:text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-baseline gap-1">
        {loading ? (
          <div className="h-10 w-20 bg-gray-100 dark:bg-muted rounded animate-pulse" />
        ) : (
          <>
            <span className="text-3xl font-bold text-orange-500">{fatLostKg}</span>
            <span className="text-lg text-gray-500 dark:text-muted-foreground font-medium">kg</span>
          </>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-muted-foreground mt-1">
        since {new Date(cutStartDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
      </p>

      {result && !loading && (
        <p className="text-xs text-gray-600 dark:text-muted-foreground mt-2 leading-relaxed">
          {result.summary}
        </p>
      )}

      {showInfo && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-border">
          <p className="text-[11px] text-gray-500 dark:text-muted-foreground leading-relaxed">
            Based on weekly morning weigh-ins (fasted, no clothes, post-toilet) and strength trends on compound lifts. If strength is maintained, weight loss is attributed to fat. If strength drops, muscle loss is estimated using established research (Weinheimer et al. 2010; Helms et al. 2014).
          </p>
        </div>
      )}
    </div>
  );
}