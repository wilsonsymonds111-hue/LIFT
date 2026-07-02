import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Dumbbell, RefreshCw, TrendingUp, ChevronRight, X, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  calculateMuscleMass,
  generateSummary,
  determineTrainingStatus,
  est1RM,
  isCompoundLift,
  EVIDENCE_STUDIES,
} from '@/lib/muscleMassModel';

const CACHE_KEY = 'muscleMassPrediction_v2';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export default function MuscleMassCard({ templates, compact, targetSessionsPerWeek }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const splitExerciseNames = useMemo(() => {
    const names = new Set();
    (templates || []).forEach(t => {
      (t.exerciseList || []).forEach(e => { if (e.name) names.add(e.name); });
    });
    return [...names];
  }, [templates]);

  const compute = useCallback(async (force = false) => {
    if (!force) {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setPrediction(cached.data);
          setLoading(false);
          return;
        }
      } catch {}
    }

    if (splitExerciseNames.length === 0) {
      setLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const weightEntries = await base44.entities.BodyWeight.list('date', 100);
      const allExercises = await base44.entities.Exercise.list('name', 200);

      const splitExercises = (allExercises || []).filter(
        e => splitExerciseNames.includes(e.name) && e.history && e.history.length > 0
      );

      if (weightEntries.length < 2 && splitExercises.length === 0) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Body weight data
      const sortedWeights = [...weightEntries].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      const startingWeight = sortedWeights[0]?.weight ?? null;
      const currentWeight = sortedWeights[sortedWeights.length - 1]?.weight ?? null;
      const weightChange = (startingWeight != null && currentWeight != null)
        ? currentWeight - startingWeight : null;

      // Collect all dates for timespan & session count
      const allDates = new Set();
      sortedWeights.forEach(e => { if (e.date) allDates.add(e.date.slice(0, 10)); });
      splitExercises.forEach(ex => {
        (ex.history || []).forEach(h => { if (h.date) allDates.add(h.date.slice(0, 10)); });
      });

      const dateStrings = [...allDates].sort();
      const firstDate = dateStrings[0] ? new Date(dateStrings[0]) : null;
      const lastDate = dateStrings[dateStrings.length - 1] ? new Date(dateStrings[dateStrings.length - 1]) : null;
      const weeksTrained = firstDate && lastDate
        ? Math.max(1, Math.round((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000)))
        : 1;

      // Count unique workout sessions (exercise history dates only)
      const workoutDates = new Set();
      splitExercises.forEach(ex => {
        (ex.history || []).forEach(h => { if (h.date) workoutDates.add(h.date.slice(0, 10)); });
      });
      const sessionsPerWeek = weeksTrained > 0 ? workoutDates.size / weeksTrained : 0;

      // Build exercise strength data
      const exercisesData = splitExercises.map(ex => {
        const sorted = [...(ex.history || [])].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        const first = sorted[0];
        const latest = sorted[sorted.length - 1];
        const starting1RM = est1RM(first?.kg, first?.reps);
        const latest1RM = est1RM(latest?.kg, latest?.reps);
        const percentIncrease = (starting1RM && starting1RM > 0)
          ? (latest1RM - starting1RM) / starting1RM
          : 0;
        return {
          name: ex.name,
          isCompound: isCompoundLift(ex.name),
          starting_est_1rm: starting1RM,
          latest_est_1rm: latest1RM,
          percentIncrease,
        };
      }).filter(s => s.starting_est_1rm && s.latest_est_1rm);

      // Avg 1RM-to-bodyweight ratio for training status determination
      const bw = currentWeight || startingWeight || 70;
      const compoundRatios = exercisesData
        .filter(e => e.isCompound && e.latest_est_1rm)
        .map(e => e.latest_est_1rm / bw);
      const avg1RMRatio = compoundRatios.length > 0
        ? compoundRatios.reduce((a, b) => a + b, 0) / compoundRatios.length
        : null;

      const trainingStatus = determineTrainingStatus(workoutDates.size, avg1RMRatio);

      const result = calculateMuscleMass({
        startingWeight,
        currentWeight,
        weightChange,
        weeksTrained,
        exercises: exercisesData,
        sessionsPerWeek,
        targetSessionsPerWeek: targetSessionsPerWeek || 4,
        trainingStatus,
      });

      const summary = generateSummary(result);
      const data = { ...result, summary };

      localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      setPrediction(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
    setRefreshing(false);
  }, [splitExerciseNames, targetSessionsPerWeek]);

  useEffect(() => { compute(); }, [compute]);

  const wrapperClass = compact ? '' : 'px-4 py-2';
  const handleClick = () => {
    if (prediction) setShowDetail(true);
    else if (!loading) compute(true);
  };

  return (
    <>
      <div className={wrapperClass}>
        <div
          onClick={handleClick}
          style={{ backgroundColor: 'rgba(249, 249, 249, 0.85)', backdropFilter: 'blur(40px) saturate(180%)', WebkitBackdropFilter: 'blur(40px) saturate(180%)' }}
          className="relative rounded-2xl p-2.5 transition-all duration-150 hover:scale-[1.01] border border-white/80 dark:border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(255,255,255,0.5)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_0_0_1px_rgba(255,255,255,0.1)] cursor-pointer active:scale-[0.98]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/40 rounded-md flex items-center justify-center">
                <Dumbbell className="w-2.5 h-2.5 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-muted-foreground">Muscle Gain</span>
            </div>
            <div className="flex items-center gap-0.5">
              {refreshing ? (
                <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400 dark:text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              {loading ? (
                <div className="h-5 w-14 bg-gray-100 dark:bg-muted rounded animate-pulse" />
              ) : prediction ? (
                <>
                  <span className="text-xl font-bold text-black dark:text-foreground">
                    {prediction.muscleGainG}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-muted-foreground font-medium">g</span>
                </>
              ) : (
                <span className="text-sm text-gray-400 dark:text-muted-foreground">Tap to analyze</span>
              )}
            </div>

            {prediction && (
              <TrendingUp className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && prediction && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowDetail(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl border border-border max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-foreground">Muscle Mass Estimate</h3>
              <button onClick={() => setShowDetail(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="text-center mb-5">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-extrabold text-blue-500">
                  {prediction.muscleGainG}
                </span>
                <span className="text-lg text-muted-foreground font-medium">g</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">predicted muscle gained</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Range: {prediction.confidenceLowG}–{prediction.confidenceHighG} g
              </p>
            </div>

            <div className="flex justify-between text-sm py-2 border-t border-border">
              <span className="text-muted-foreground">Body fat change</span>
              <span className={`font-semibold ${prediction.fatGainG < 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {prediction.fatGainG > 0 ? '+' : ''}{prediction.fatGainG} g
              </span>
            </div>

            {prediction.trainingStatus && (
              <div className="flex justify-between text-sm py-2 border-t border-border">
                <span className="text-muted-foreground">Training level</span>
                <span className="font-semibold text-foreground capitalize">{prediction.trainingStatus}</span>
              </div>
            )}

            <div className="py-3 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">{prediction.summary}</p>
            </div>

            {/* Evidence section */}
            <div className="py-3 border-t border-border">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase">Evidence</p>
              </div>
              <div className="space-y-1.5">
                {EVIDENCE_STUDIES.map((study, i) => (
                  <div key={i} className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium">{study.citation}</span> — <span className="italic">{study.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setShowDetail(false); compute(true); }}
              className="w-full mt-2 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Recalculate
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}