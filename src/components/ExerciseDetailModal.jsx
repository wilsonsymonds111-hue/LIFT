import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ensureExerciseDetail } from '../lib/ensureExerciseDetail';
import { getExerciseDetailList } from '../lib/exerciseCache';
import ProgressGraph, { getNextGoal } from './ProgressGraph';
import { MUSCLE_COLORS } from '../lib/exercises';
import { isCustomExercise, deleteCustomExercise } from '../lib/customExercises';
import ExerciseGoalSetter from './ExerciseGoalSetter';

const TABS = ['Charts', 'About'];

const parseInstructions = (text) => {
  if (!text) return [];
  return text.split('\n').filter(line => /^\d+\./.test(line.trim()));
};

export default function ExerciseDetailModal({ exercise, onClose, initialTab, initialHistory, initialImage, onExerciseDeleted }) {
  const [tab, setTab] = useState(initialTab || 'Charts');
  const [history, setHistory] = useState(initialHistory || []);
  const [detail, setDetail] = useState(initialImage ? { image_url: initialImage } : null);
  const [loadingDetail, setLoadingDetail] = useState(!initialImage);
  const [loadingHistory, setLoadingHistory] = useState(!initialHistory);
  const [goal, setGoal] = useState(null);
  const [shimmer, setShimmer] = useState(false);
  const [chartView, setChartView] = useState('weight');
  const [swipeDir, setSwipeDir] = useState(0);

  const switchView = useCallback((view) => {
    setSwipeDir(view === 'reps' ? 1 : -1);
    setChartView(view);
  }, []);

  const handleDragEnd = useCallback((_, info) => {
    if (info.offset.x < -50 && chartView === 'weight') {
      switchView('reps');
    } else if (info.offset.x > 50 && chartView === 'reps') {
      switchView('weight');
    }
  }, [chartView, switchView]);

  useEffect(() => { setTimeout(() => setShimmer(true), 200); }, []);

  // Fetch workout history from the Exercise entity (only if not passed in)
  useEffect(() => {
    base44.entities.Exercise.filter({ name: exercise.name }).then(results => {
      if (results.length > 0) {
        setGoal(results[0].goal || null);
        if (!initialHistory) setHistory(results[0].history || []);
      } else {
        setGoal(null);
        if (!initialHistory) setHistory([]);
      }
      if (!initialHistory) setLoadingHistory(false);
    });
  }, [exercise.name, initialHistory]);

  // Fetch or generate exercise detail (instructions + image)
  useEffect(() => {
    // Use cached ExerciseDetail list (already warmed by parent pages) to avoid a fresh API call
    getExerciseDetailList().then(async (cached) => {
      const results = (cached || []).filter(d => d.name === exercise.name);
      // If we already have image from parent, keep it; otherwise use cached
      if (results?.length > 0 && results[0].instructions) {
        setDetail(prev => ({ ...results[0], image_url: prev?.image_url || results[0].image_url }));
        setLoadingDetail(false);
        return;
      }
      // No instructions in cache — check if we at least have the image cached
      const cachedDetail = results?.[0];
      if (cachedDetail?.image_url || initialImage) {
        setDetail(prev => ({ ...prev, image_url: initialImage || cachedDetail?.image_url }));
      }
      // Generate via shared utility (image + muscles), then add instructions
      try {
        const generated = await ensureExerciseDetail(exercise.name);
        const llmRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Write 4 short, numbered step-by-step instructions for how to perform the "${exercise.name}" exercise at the gym. Keep each step to 1-2 sentences. Be clear and concise. Output format: plain text with each step on a new line starting with the number and a period.`,
        });
        const instructions = llmRes?.data || llmRes || '';
        const fresh = await base44.entities.ExerciseDetail.filter({ name: exercise.name });
        if (fresh?.length > 0) {
          await base44.entities.ExerciseDetail.update(fresh[0].id, { instructions });
          setDetail({ ...fresh[0], image_url: generated.image_url || initialImage, instructions, muscles_worked: generated.muscles_worked || fresh[0].muscles_worked });
        }
      } catch (_) {}
      setLoadingDetail(false);
    });
  }, [exercise.name, initialImage]);

  const allEntries = history.length > 0 ? history : [];
  const isBodyweight = allEntries.length > 0
    ? allEntries.every(h => { const kg = h.kg ?? 0; return kg === 0 || kg == null; })
    : false;

  const colors = MUSCLE_COLORS[exercise.muscle] || MUSCLE_COLORS['Full Body'];

  // Reps chart: filter to current max weight level, showing rep progression within that weight plateau
  const repsHistory = history.length > 0
    ? (() => {
        const kgs = history.map(h => h.kg || 0).filter(k => k > 0);
        const maxKg = kgs.length > 0 ? Math.max(...kgs) : 0;
        const filtered = maxKg > 0
          ? history.filter(h => (h.kg || 0) === maxKg)
          : history;
        return filtered.map(h => ({ kg: 0, reps: h.reps || 0, date: h.date }));
      })()
    : [];

  const chartData = chartView === 'reps' ? repsHistory : history;
  const chartIsBodyweight = chartView === 'reps' ? true : isBodyweight;

  // Current weight level for the reps chart
  const kgVals = history.map(h => h.kg || 0).filter(k => k > 0);
  const repsWeightLevel = kgVals.length > 0 ? Math.max(...kgVals) : null;

  // Compute stats from the active chart data so they always match the graph
  const stats = history.length > 0
    ? (() => {
        const isRepsView = chartView === 'reps' && !isBodyweight;
        if (isRepsView) {
          // Reps chart for weighted exercise — stats reflect rep progression at current max weight
          const entries = repsHistory;
          const allReps = entries.map(h => h.reps || 0);
          const firstReps = entries[0]?.reps || 0;
          const bestReps = Math.max(...allReps);
          const suggestion = getNextGoal(exercise.name, history) || `${bestReps + 1} reps`;
          return {
            start: firstReps + ' reps',
            best: bestReps + ' reps',
            increase: `+${bestReps - firstReps} reps`,
            suggestion,
          };
        }
        // Weight chart (or true bodyweight) — full history stats
        const kgs = history.map(h => h.kg || 0).filter(k => k > 0);
        const reps = history.map(h => h.reps || 0);
        const bestKg = Math.max(...kgs);
        const bestEntry = history
          .filter(h => (h.kg || 0) === bestKg)
          .sort((a, b) => (b.reps || 0) - (a.reps || 0))[0];
        const bestReps = bestEntry?.reps || 0;
        const firstKg = history[0]?.kg || 0;
        const firstReps = history[0]?.reps || 0;
        const increase = bestKg - firstKg;
        const suggestion = getNextGoal(exercise.name, history) || (isBodyweight
          ? (Math.max(...reps) + 1) + ' reps'
          : `${bestKg} kg × ${bestReps + 1}`);
        return {
          start: isBodyweight ? firstReps + ' reps' : firstKg + ' kg',
          best: isBodyweight ? Math.max(...reps) + ' reps' : `${bestKg} kg × ${bestReps}`,
          increase: isBodyweight ? (Math.max(...reps) - firstReps) + ' reps' : `+${increase} kg`,
          suggestion,
        };
      })()
    : null;

  // Override AI suggestion with the user's explicit goal if set
  if (goal && stats) stats.suggestion = `${goal.kg} kg × ${goal.reps}`;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="relative bg-card rounded-3xl w-[92%] max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted hover:bg-muted/70 transition">
            <X className="w-5 h-5 text-foreground" />
          </button>
          <h2 className="font-bold text-lg text-foreground tracking-tight">{exercise.name}</h2>
          {isCustomExercise(exercise.name) ? (
            <button
              onClick={() => {
                if (window.confirm(`Delete "${exercise.name}" from your exercise list?`)) {
                  deleteCustomExercise(exercise.name);
                  onExerciseDeleted?.();
                  onClose();
                }
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mx-5 flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 pb-3 pt-1 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'text-foreground border-b-2 border-blue-500 -mb-[1px]'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-y-auto px-5 py-4" style={{ minHeight: '320px' }}>
          {/* About Tab */}
          {tab === 'About' && (
            <div className="space-y-4">
              {/* Image */}
              {loadingDetail ? (
                <div className="w-full aspect-video bg-muted rounded-2xl flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : detail?.image_url ? (
                <div className="relative w-full bg-muted rounded-2xl overflow-hidden">
                  <img src={detail.image_url} alt={exercise.name} className="w-full block" loading="lazy" decoding="async" />
                </div>
              ) : (
                <div className={`w-full aspect-video rounded-2xl flex items-center justify-center ${colors.bg}`}>
                  <span className={`text-5xl font-extrabold ${colors.text}`}>{exercise.name[0]}</span>
                </div>
              )}

              {/* Muscle info */}
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-foreground">Muscles Worked</p>
                {detail?.muscles_worked && (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.muscles_worked.split(',').map(m => (
                      <span key={m.trim()} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                        {m.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              {loadingDetail ? (
                <div className="space-y-3">
                  <p className="font-bold text-foreground">Instructions</p>
                  <div className="space-y-2">
                    {[1,2,3,4].map(i => <div key={i} className="h-4 bg-muted rounded animate-pulse" />)}
                  </div>
                </div>
              ) : detail?.instructions ? (
                <div>
                  <p className="font-bold text-foreground mb-2">Instructions</p>
                  <ol className="list-decimal list-inside space-y-2">
                    {parseInstructions(detail.instructions).map((line, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed">
                        {line.replace(/^\d+\.\s*/, '')}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No instructions available yet.</p>
              )}
            </div>
          )}

          {/* Charts Tab */}
          {tab === 'Charts' && (
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : history.length > 0 ? (
                <>
                  {/* Segmented chart switcher */}
                  <div className="flex justify-center">
                    <div className="inline-flex bg-muted rounded-full p-0.5">
                      <button
                        onClick={() => switchView('weight')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          chartView === 'weight'
                            ? 'bg-white dark:bg-gray-600 text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Weight
                      </button>
                      <button
                        onClick={() => switchView('reps')}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          chartView === 'reps'
                            ? 'bg-white dark:bg-gray-600 text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        Reps
                      </button>
                    </div>
                  </div>
                  <div className="overflow-hidden touch-pan-y" style={{ touchAction: 'pan-y' }}>
                    <motion.div
                      key={chartView}
                      initial={{ x: swipeDir * 60, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.15}
                      onDragEnd={handleDragEnd}
                      style={{ touchAction: 'pan-y' }}
                    >
                      <ProgressGraph
                        history={chartData}
                        animKey={`${chartView}-${history.length}`}
                        animDir="add"
                        isBodyweight={chartIsBodyweight}
                        exerciseName={exercise.name}
                        goal={goal}
                        chartView={chartView}
                        repsChartWeight={repsWeightLevel}
                        labelOverride={chartView === 'reps' && repsWeightLevel ? `Reps Progress of ${repsWeightLevel} kg` : null}
                      />
                    </motion.div>
                  </div>
                  {stats && (
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Starting Weight', value: stats.start },
                        { label: 'Increase', value: stats.increase },
                        { label: 'Best', value: stats.best },
                        { label: 'Next Goal', value: stats.suggestion, isAI: true },
                      ].map(s => (
                        <div
                          key={s.label}
                          className={s.isAI
                            ? 'rounded-xl px-1.5 py-2.5 flex flex-col items-center justify-center bg-white overflow-hidden relative border-2 border-dashed border-purple-300'
                            : s.label === 'Best'
                            ? `rounded-xl px-1.5 py-2.5 flex flex-col items-center justify-center bg-gradient-to-br from-amber-200/60 to-amber-100/30 overflow-hidden relative ${shimmer ? 'gold-shimmer' : ''}`
                            : 'rounded-xl px-1.5 py-2.5 flex flex-col items-center justify-center bg-blue-400'
                          }
                        >
                          {s.label === 'Best' && s.value.includes(' × ') ? (
                            <>
                              <p className="text-xs font-semibold relative z-10 leading-tight text-foreground">{s.value.split(' × ')[0]}</p>
                              <p className="text-xs font-semibold relative z-10 leading-tight text-foreground">× {s.value.split(' × ')[1]}</p>
                            </>
                          ) : (
                            <p className={`text-xs font-semibold relative z-10 ${s.isAI ? 'text-foreground' : s.label === 'Best' ? 'text-foreground' : 'text-white'}`}>{s.value}</p>
                          )}
                          <p className={`text-[9px] font-medium uppercase tracking-wider mt-0.5 relative z-10 text-center ${s.isAI ? 'text-muted-foreground' : s.label === 'Best' ? 'text-muted-foreground' : 'text-blue-50'}`}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-center text-muted-foreground py-12">No workout history yet. Start a workout to see your progress!</p>
              )}
            </div>
          )}

        </div>
      </div>
    </div>,
    document.body
  );
}