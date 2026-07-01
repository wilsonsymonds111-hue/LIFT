import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Dumbbell, RefreshCw, TrendingUp, ChevronRight, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const CACHE_KEY = 'muscleMassPrediction';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Epley formula: estimated 1RM = weight × (1 + reps/30)
const est1RM = (kg, reps) => (kg ? kg * (1 + (reps || 1) / 30) : null);

export default function MuscleMassCard({ templates, compact }) {
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

      const sortedWeights = [...weightEntries].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      const startingWeight = sortedWeights[0]?.weight ?? null;
      const currentWeight = sortedWeights[sortedWeights.length - 1]?.weight ?? null;
      const weightChange = (startingWeight != null && currentWeight != null)
        ? currentWeight - startingWeight : null;

      const firstDate = sortedWeights[0]?.date ? new Date(sortedWeights[0].date) : null;
      const lastDate = sortedWeights[sortedWeights.length - 1]?.date ? new Date(sortedWeights[sortedWeights.length - 1].date) : null;
      const weeksTrained = firstDate && lastDate
        ? Math.max(1, Math.round((lastDate - firstDate) / (7 * 24 * 60 * 60 * 1000)))
        : null;

      const strengthData = splitExercises.map(ex => {
        const sorted = [...(ex.history || [])].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );
        const first = sorted[0];
        const latest = sorted[sorted.length - 1];
        return {
          name: ex.name,
          muscle: ex.muscle || 'unknown',
          starting_top_set: first ? { kg: first.kg, reps: first.reps } : null,
          latest_top_set: latest ? { kg: latest.kg, reps: latest.reps } : null,
          starting_est_1rm: est1RM(first?.kg, first?.reps),
          latest_est_1rm: est1RM(latest?.kg, latest?.reps),
          sessions_logged: sorted.length,
        };
      }).filter(s => s.starting_top_set && s.latest_top_set);

      const payload = {
        starting_weight_kg: startingWeight,
        current_weight_kg: currentWeight,
        total_weight_gained_kg: weightChange,
        weeks_tracked: weeksTrained,
        exercises_tracked: strengthData.length,
        strength_progression: strengthData,
      };

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert exercise physiologist specializing in body composition analysis. Based on the user's body weight log and strength progression data from their current workout split, predict how much skeletal muscle mass (in kg) the user has most likely gained.

Apply these research-backed principles:

1. BODY COMPOSITION PARTITIONING: In a caloric surplus with resistance training, approximately 50-70% of weight gained is lean body mass (muscle + water/glycogen), with the remainder being fat. For trained individuals, ~40-50% of total weight gain is actual contractile muscle tissue; for beginners (first 6-12 months), it can be 60-70% (Helms et al., 2014; muscle gain partitioning literature).

2. RATES OF MUSCLE GAIN: Trained individuals gain roughly 0.5-1% of body weight per month in muscle mass during a lean bulk. Beginners can gain 1-2% per month (Lyle McDonald model; Schoenfeld, 2017). For a 75kg person: 0.4-0.75 kg/month (trained), 0.75-1.5 kg/month (beginner).

3. STRENGTH-HYPERTROPHY CORRELATION: Increases in working weight and estimated 1RM strongly correlate with muscle cross-sectional area increases, especially in compound movements. A 10-20% increase in top-set load over weeks typically indicates measurable hypertrophy (Bickel et al., 2011; Schoenfeld, 2010). Use the Epley formula for 1RM: 1RM = weight × (1 + reps/30).

4. MUSCLE TISSUE COMPOSITION: Skeletal muscle is ~70% water. DEXA-measured lean mass includes water, glycogen, and connective tissue, so distinguish "lean mass gain" from "contractile tissue gain." Actual muscle protein accretion is ~30-40% of lean mass gain (Verscheijden et al., 2022).

5. WEIGHT GAIN INFERENCE: If body weight has increased, estimate the muscle portion using the partitioning ratios above, adjusted by the magnitude of strength gains (more strength gain = higher muscle fraction). If body weight has decreased but strength increased, the user may be recomposing (simultaneous fat loss + muscle gain), which typically yields 0.25-1 kg muscle gain per month depending on training status.

6. If the user has LOST weight but gained strength, predict muscle gain based on recomp rates (typically 0.25-0.5 kg/month for trained, up to 1 kg/month for beginners in a deficit).

Here is the user's data (all weights in kg):
${JSON.stringify(payload, null, 2)}

Analyze the data and return your prediction. Be conservative and evidence-based.`,
        response_json_schema: {
          type: "object",
          properties: {
            predicted_muscle_mass_kg: { type: "number", description: "Estimated kg of skeletal muscle mass gained, rounded to 1 decimal" },
            confidence_low_kg: { type: "number", description: "Lower bound of the estimate" },
            confidence_high_kg: { type: "number", description: "Upper bound of the estimate" },
            estimated_body_fat_gained_kg: { type: "number", description: "Estimated kg of body fat gained or lost (negative = lost)" },
            training_status: { type: "string", description: "Beginner, Intermediate, or Advanced based on strength levels" },
            summary: { type: "string", description: "1-2 sentence explanation citing the key reasoning and studies applied" }
          },
          required: ["predicted_muscle_mass_kg", "confidence_low_kg", "confidence_high_kg", "summary"]
        }
      });

      localStorage.setItem(CACHE_KEY, JSON.stringify({ data: res, timestamp: Date.now() }));
      setPrediction(res);
      setLoading(false);
    } catch {
      setLoading(false);
    }
    setRefreshing(false);
  }, [splitExerciseNames]);

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
          className="relative bg-white dark:bg-card rounded-2xl p-2.5 transition-all duration-150 hover:scale-[1.01] border border-gray-200/70 dark:border-border cursor-pointer active:scale-[0.98]"
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
                    {Math.round((prediction.predicted_muscle_mass_kg || 0) * 1000)}
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
            className="bg-card rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl border border-border"
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
                  {Math.round((prediction.predicted_muscle_mass_kg || 0) * 1000)}
                </span>
                <span className="text-lg text-muted-foreground font-medium">g</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">predicted muscle gained</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Range: {Math.round((prediction.confidence_low_kg || 0) * 1000)}–{Math.round((prediction.confidence_high_kg || 0) * 1000)} g
              </p>
            </div>

            {prediction.estimated_body_fat_gained_kg != null && (
              <div className="flex justify-between text-sm py-2 border-t border-border">
                <span className="text-muted-foreground">Body fat change</span>
                <span className={`font-semibold ${prediction.estimated_body_fat_gained_kg < 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {prediction.estimated_body_fat_gained_kg > 0 ? '+' : ''}{Math.round(prediction.estimated_body_fat_gained_kg * 1000)} g
                </span>
              </div>
            )}

            {prediction.training_status && (
              <div className="flex justify-between text-sm py-2 border-t border-border">
                <span className="text-muted-foreground">Training level</span>
                <span className="font-semibold text-foreground">{prediction.training_status}</span>
              </div>
            )}

            <div className="py-3 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed">{prediction.summary}</p>
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