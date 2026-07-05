import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, X, BookOpen, ChevronRight, TrendingUp, TrendingDown, Activity, BicepsFlexed, Zap, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  calculateMuscleMass,
  generateSummary,
  determineTrainingStatus,
  est1RM,
  isCompoundLift,
  EVIDENCE_STUDIES,
} from '@/lib/muscleMassModel';
import BodyWeightChartModal from './BodyWeightChartModal';

const CACHE_KEY = 'muscleMassPrediction_v2';
const CACHE_TTL = 6 * 60 * 60 * 1000;

export default function BodyStatsCard({ templates, targetSessionsPerWeek }) {
  const [weightEntries, setWeightEntries] = useState([]);
  const [weightLoading, setWeightLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [muscleLoading, setMuscleLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMuscleModal, setShowMuscleModal] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      const results = await base44.entities.BodyWeight.list('-date', 30);
      setWeightEntries(results || []);
    } catch {
      setWeightEntries([]);
    }
    setWeightLoading(false);
  }, []);

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
          setMuscleLoading(false);
          return;
        }
      } catch {}
    }

    if (splitExerciseNames.length === 0) {
      setMuscleLoading(false);
      return;
    }

    setRefreshing(true);
    try {
      const weightEntriesAll = await base44.entities.BodyWeight.list('date', 100);
      const allExercises = await base44.entities.Exercise.list('name', 200);

      const splitExercises = (allExercises || []).filter(
        e => splitExerciseNames.includes(e.name) && e.history && e.history.length > 0
      );

      if (weightEntriesAll.length < 2 && splitExercises.length === 0) {
        setMuscleLoading(false);
        setRefreshing(false);
        return;
      }

      const sortedWeights = [...weightEntriesAll].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      const startingWeight = sortedWeights[0]?.weight ?? null;
      const currentWeight = sortedWeights[sortedWeights.length - 1]?.weight ?? null;
      const weightChange = (startingWeight != null && currentWeight != null)
        ? currentWeight - startingWeight : null;

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

      const workoutDates = new Set();
      splitExercises.forEach(ex => {
        (ex.history || []).forEach(h => { if (h.date) workoutDates.add(h.date.slice(0, 10)); });
      });
      const sessionsPerWeek = weeksTrained > 0 ? workoutDates.size / weeksTrained : 0;

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
      setMuscleLoading(false);
    } catch {
      setMuscleLoading(false);
    }
    setRefreshing(false);
  }, [splitExerciseNames, targetSessionsPerWeek]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { compute(); }, [compute]);

  const latest = weightEntries[0];
  // Fat loss: prediction.fatGainG is negative when fat is lost
  const fatLossG = prediction ? Math.abs(Math.min(0, prediction.fatGainG)) : null;

  // Goal mode: 'cutting' (gold) or 'bulking' (blue)
  const goalMode = (() => {
    try { return localStorage.getItem('goalMode') || 'cutting'; } catch { return 'cutting'; }
  })();

  // Last 5 weight entries in chronological order for the mini sparkline
  const sparkData = useMemo(() => {
    const last6 = weightEntries.slice(0, 6).reverse();
    return last6.map(e => e.weight).filter(w => w != null);
  }, [weightEntries]);

  const sparklinePoints = useMemo(() => {
    if (sparkData.length < 2) return null;
    const W = 56, H = 28, PAD = 3;
    const min = Math.min(...sparkData);
    const max = Math.max(...sparkData);
    const range = max - min || 1;
    const stepX = (W - PAD * 2) / Math.max(sparkData.length - 1, 1);
    return sparkData.map((v, i) => ({
      x: PAD + i * stepX,
      y: PAD + (H - PAD * 2) - ((v - min) / range) * (H - PAD * 2),
    }));
  }, [sparkData]);

  const handleMuscleClick = () => {
    if (prediction) setShowMuscleModal(true);
    else if (!muscleLoading) compute(true);
  };

  const isCutting = goalMode === 'cutting';
  const textPrimary = isCutting ? 'text-gray-900' : 'text-white';
  const textSecondary = isCutting ? 'text-gray-600' : 'text-white/70';
  const textLabel = isCutting ? 'text-gray-500' : 'text-white/80';
  const textMuted = isCutting ? 'text-gray-500' : 'text-white/60';
  const chipBg = isCutting ? 'bg-black/10' : 'bg-white/15';
  const skeletonBg = isCutting ? 'bg-black/10' : 'bg-white/20';
  const sparkStroke = isCutting ? 'rgba(100,100,100,0.45)' : 'rgba(255,255,255,0.85)';
  const sparkFill = isCutting ? '#777' : 'white';
  const emeraldIcon = isCutting ? 'text-emerald-600' : 'text-emerald-300';
  const orangeIcon = isCutting ? 'text-orange-600' : 'text-orange-300';

  return (
    <>
      <div className="px-1">
        <div
          onClick={() => setShowWeightModal(true)}
          className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] ${goalMode === 'cutting' ? 'shadow-[0_12px_36px_rgba(212,160,23,0.25),0_2px_8px_rgba(212,160,23,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.3)]' : 'shadow-[0_16px_48px_rgba(37,99,235,0.45),0_4px_12px_rgba(37,99,235,0.2)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.3)]'}`}
          style={{
            background: goalMode === 'cutting'
              ? 'linear-gradient(135deg, #fef9e7 0%, #fdf4d3 45%, #fcf0c0 100%)'
              : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 45%, #3b82f6 100%)',
            ...(goalMode === 'cutting' ? { border: '1.5px solid #c9a227' } : {}),
          }}
        >
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="relative p-4">
            {/* Top row: label + status pill + arrow */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Activity className={`w-3.5 h-3.5 ${textLabel}`} />
                <span className={`text-xs font-bold ${textLabel} uppercase tracking-wide`}>Body Stats</span>
                {goalMode === 'bulking' ? (
                  <span className="flex items-center gap-1 bg-blue-500 rounded-full px-2 py-0.5 shadow-sm">
                    <BicepsFlexed className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase">Bulking</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-amber-500 rounded-full px-2 py-0.5 shadow-sm">
                    <Flame className="w-3 h-3 text-white" />
                    <span className="text-[10px] font-bold text-white uppercase">Cutting</span>
                  </span>
                )}
              </div>
              <div className={`w-7 h-7 rounded-full ${skeletonBg} flex items-center justify-center`}>
                <ChevronRight className={`w-4 h-4 ${textLabel}`} />
              </div>
            </div>

            {/* Weight + sparkline row */}
            <div className="flex items-end justify-between gap-2 mb-2.5">
              <div className="flex items-end gap-1">
                {weightLoading ? (
                  <div className={`h-9 w-20 ${skeletonBg} rounded-lg animate-pulse`} />
                ) : latest ? (
                  <>
                    <span className={`text-3xl font-extrabold ${textPrimary} leading-none`}>{latest.weight}</span>
                    <span className={`text-sm ${textSecondary} font-semibold mb-0.5`}>kg</span>
                  </>
                ) : (
                  <span className={`text-base ${textLabel} font-semibold`}>Tap to log</span>
                )}
              </div>
              {sparklinePoints && (
                <svg width="56" height="28" viewBox="0 0 56 28" className="flex-shrink-0">
                  <polyline
                    points={sparklinePoints.map(p => `${p.x},${p.y}`).join(' ')}
                    fill="none"
                    stroke={sparkStroke}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {sparklinePoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={sparkFill} />
                  ))}
                </svg>
              )}
            </div>

            {/* Quick stats row */}
            <div className="flex items-center gap-2 flex-wrap">
              {prediction ? (
                <>
                  {prediction.muscleGainG > 0 && (
                    <div className={`flex items-center gap-1 ${chipBg} rounded-full px-2.5 py-1`}>
                      <TrendingUp className={`w-3 h-3 ${emeraldIcon}`} />
                      <span className={`text-[11px] font-semibold ${textPrimary}`}>+{prediction.muscleGainG}g muscle</span>
                    </div>
                  )}
                  <div className={`flex items-center gap-1 ${chipBg} rounded-full px-2.5 py-1`}>
                    <TrendingDown className={`w-3 h-3 ${orangeIcon}`} />
                    <span className={`text-[11px] font-semibold ${textPrimary}`}>{fatLossG || 0}g fat lost</span>
                  </div>
                </>
              ) : muscleLoading ? (
                <div className={`h-6 w-28 ${chipBg} rounded-full animate-pulse`} />
              ) : (
                <p className={`text-[11px] ${textMuted} font-medium`}>Log workouts & weight for insights</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weight Chart Modal — shows bodyweight history, muscle gain, and fat loss */}
      {showWeightModal && (
        <BodyWeightChartModal
          entries={weightEntries}
          onClose={() => setShowWeightModal(false)}
          onChanged={fetchEntries}
          prediction={prediction}
          muscleLoading={muscleLoading}
          refreshing={refreshing}
          fatLossG={fatLossG}
          onRecalculate={() => compute(true)}
        />
      )}

      {/* Muscle Mass Detail Modal */}
      {showMuscleModal && prediction && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowMuscleModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl border border-border max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-foreground">Muscle Mass Estimate</h3>
              <button onClick={() => setShowMuscleModal(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted">
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
              onClick={() => { setShowMuscleModal(false); compute(true); }}
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