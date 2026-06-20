import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProgressGraph, { getNextGoal } from './ProgressGraph';
import { MUSCLE_COLORS } from '../lib/exercises';

export default function ExerciseDetailModal({ exercise, onClose }) {
  const [tab, setTab] = useState('Charts');
  const [history, setHistory] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
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

  // Fetch workout history from the Exercise entity (shared across all splits)
  useEffect(() => {
    base44.entities.Exercise.filter({ name: exercise.name }).then(results => {
      if (results.length > 0) {
        setHistory(results[0].history || []);
      } else {
        setHistory([]);
      }
      setLoadingHistory(false);
    });
  }, [exercise.name]);

  // Fetch or generate exercise detail (instructions + image)
  useEffect(() => {
    setLoadingDetail(true);
    base44.entities.ExerciseDetail.filter({ name: exercise.name }).then(async (results) => {
      if (results?.length > 0) {
        setDetail(results[0]);
        setLoadingDetail(false);
      } else {
        // Generate details via LLM: first determine muscles, then image + instructions
        try {
          // Step 1: get the muscles worked
          const musclesRes = await base44.integrations.Core.InvokeLLM({
            prompt: `List the primary and secondary muscle groups worked by the "${exercise.name}" exercise. Output ONLY a comma-separated list, e.g. "Chest, Front Delts, Triceps". Keep it to 3-5 muscles max. No other text.`,
          });
          const muscles_worked = (musclesRes?.data || musclesRes || exercise.muscle).trim();

          // Step 2: generate image (with specific muscles) and instructions in parallel
          const [imgRes, llmRes] = await Promise.all([
            base44.integrations.Core.GenerateImage({
              prompt: `Two side-by-side anatomical figures showing the "${exercise.name}" exercise: the left figure shows the starting position, the right figure shows the finishing position. Both figures are identical in size, proportions, camera angle, body composition, and anatomical detail. Clean white background. Grayscale anatomical style with visible musculature, no skin texture, like a fitness anatomy reference diagram. ONLY the following muscles must be highlighted in red: ${muscles_worked}. No other muscles should be red. No text, labels, arrows, numbers, logos, watermarks, or annotations. Exercise equipment accurately represented for each phase. Professional museum-quality medical illustration style.`,
            }).catch(() => ({ url: '' })),
            base44.integrations.Core.InvokeLLM({
              prompt: `Write 4 short, numbered step-by-step instructions for how to perform the "${exercise.name}" exercise at the gym. Keep each step to 1-2 sentences. Be clear and concise. Output format: plain text with each step on a new line starting with the number and a period.`,
            }),
          ]);
          const image_url = imgRes?.url || '';
          const instructions = llmRes?.data || llmRes || '';
          const newDetail = await base44.entities.ExerciseDetail.create({
            name: exercise.name,
            instructions,
            image_url,
            muscles_worked,
          });
          setDetail(newDetail);
        } catch (_) {}
        setLoadingDetail(false);
      }
    });
  }, [exercise.name]);

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

  const tabs = ['Charts', 'About'];

  const parseInstructions = (text) => {
    if (!text) return [];
    return text.split('\n').filter(line => /^\d+\./.test(line.trim()));
  };

  const shimmerCSS = `
    @keyframes goldShimmer {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(300%) skewX(-15deg); }
    }
    .gold-shimmer::after {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.25) 40%, rgba(255,255,255,0.2) 50%, rgba(255,215,0,0.25) 60%, transparent 100%);
      transform: translateX(-100%) skewX(-15deg);
      animation: goldShimmer 2s ease-in-out 0.3s forwards;
      pointer-events: none;
      border-radius: inherit;
      z-index: 1;
    }
  `;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={onClose}>
      <style>{shimmerCSS}</style>
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
          <div className="w-10" />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mx-5 flex-shrink-0">
          {tabs.map(t => (
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
                  <img src={detail.image_url} alt={exercise.name} className="w-full block" />
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
                      initial={{ x: swipeDir * 80, opacity: 0.6 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
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
                          <p className={`text-xs font-semibold relative z-10 ${s.isAI ? 'text-foreground' : s.label === 'Best' ? 'text-foreground' : 'text-white'}`}>{s.value}</p>
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