import { useState, useEffect, useRef, useMemo, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

// Exercise classification helpers — exported for use in ExerciseDetailModal
const ISOLATION_KEYWORDS = ['leg extension', 'hamstring curl', 'calf raise', 'lateral raise', 'bicep curl', 'tricep extension', 'pec deck', 'cable fly', 'rear delt fly'];

export function getRepCap(exerciseName) {
  if (!exerciseName) return 12;
  const lower = exerciseName.toLowerCase();
  if (ISOLATION_KEYWORDS.some(k => lower.includes(k))) return 15;
  return 12;
}

export function getWeightIncrement(history) {
  const weights = [...new Set((history || []).map(h => h.kg || 0).filter(k => k > 0))].sort((a, b) => a - b);
  if (weights.length < 2) return 2.5;
  const diffs = [];
  for (let i = 1; i < weights.length; i++) diffs.push(weights[i] - weights[i - 1]);
  const counts = {};
  diffs.forEach(d => counts[d] = (counts[d] || 0) + 1);
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) || 2.5;
}

export function getNextGoal(exerciseName, history) {
  if (!history || history.length === 0) return null;
  const repCap = getRepCap(exerciseName);
  const kgs = history.map(h => h.kg || 0).filter(k => k > 0);
  const isBw = kgs.length === 0;

  if (isBw) {
    const maxReps = Math.max(...history.map(h => h.reps || 0));
    if (maxReps >= repCap) return `${repCap} reps (max)`;
    return `${maxReps + 1} reps`;
  }

  const maxKg = Math.max(...kgs);
  const entriesAtMax = history.filter(h => (h.kg || 0) === maxKg).sort((a, b) => (b.reps || 0) - (a.reps || 0));
  const bestReps = entriesAtMax[0]?.reps || 0;

  if (bestReps >= repCap) {
    const inc = getWeightIncrement(history);
    const snap = (v) => Math.round(v / 2.5) * 2.5;
    const newKg = snap(maxKg + inc);

    // Determine starting reps after weight increase from history transitions
    const byWeight = {};
    history.forEach(h => { const kg = h.kg || 0; if (!byWeight[kg]) byWeight[kg] = []; byWeight[kg].push(h.reps || 0); });
    const weights = Object.keys(byWeight).map(Number).sort((a, b) => a - b);
    let startingReps = Math.max(5, Math.floor(bestReps * 0.65));
    if (weights.length >= 2) {
      const transitions = [];
      for (let i = 1; i < weights.length; i++) {
        transitions.push(Math.max(...byWeight[weights[i]]));
      }
      if (transitions.length > 0) {
        startingReps = Math.round(transitions.reduce((s, r) => s + r, 0) / transitions.length);
      }
    }
    startingReps = Math.max(5, Math.min(startingReps, bestReps - 1));
    return `${newKg} kg × ${startingReps}`;
  }

  return `${maxKg} kg × ${bestReps + 1}`;
}

const ProgressGraph = memo(function ProgressGraph({ history, animKey, animDir, isBodyweight, hideLabel, labelOverride, compact, exerciseName, goal, chartView }) {
  const [freshAnim, setFreshAnim] = useState(false);
  const prevAnimKeyRef = useRef(animKey);
  useEffect(() => {
    if (animKey !== prevAnimKeyRef.current) {
      prevAnimKeyRef.current = animKey;
      setFreshAnim(true);
      const t = setTimeout(() => setFreshAnim(false), 650);
      return () => clearTimeout(t);
    }
  }, [animKey]);

  const result = useMemo(() => {
    if (!history || history.length === 0) return { empty: true };
    const toPoint = (h) => typeof h === 'object' ? h : { kg: h, reps: 8 };
    const realPoints = history.map(toPoint);
    const lastPoint = realPoints[realPoints.length - 1];
    const idx = realPoints.length - 1;

    const getValue = (p) => isBodyweight ? p.reps : p.kg;

    const formatDateShort = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { month: 'short' });
    };

    const d = realPoints.map((p, i) => ({
      session: i + 1,
      date: p.date ? (() => { const dt = new Date(p.date); return isNaN(dt) ? null : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); })() : null,
      dateShort: formatDateShort(p.date),
      valStatic: i < idx ? getValue(p) : null,
      valNew: i >= idx - 1 ? getValue(p) : null,
      projVal: i === idx ? getValue(p) : null,
      kg: p.kg,
      reps: p.reps,
    }));

    // Deduplicate repeated month labels
    let lastShort = null;
    d.forEach(item => {
      if (item.dateShort) {
        if (item.dateShort === lastShort) { item.dateShort = ''; }
        else { lastShort = item.dateShort; }
      }
    });

    // Weight progression rate for projections
    const kgs = realPoints.map(p => p.kg || 0).filter(k => k > 0);
    let rate = 2.5;
    if (kgs.length >= 2) {
      const rawRate = (kgs[kgs.length - 1] - kgs[0]) / (kgs.length - 1);
      rate = rawRate > 0 ? rawRate : 2.5;
    }
    const snap = (v) => Math.round(v / 2.5) * 2.5;

    const repCap = exerciseName ? getRepCap(exerciseName) : 0;
    const hasWeights = kgs.length > 0;

    for (let i = 1; i <= 6; i++) {
      let projVal, projKg, projReps;
      if (isBodyweight) {
        if (hasWeights && repCap > 0) {
          // Reps chart for a weighted exercise — cap at repCap
          const nextRep = lastPoint.reps + i;
          projVal = Math.min(nextRep, repCap);
          if (nextRep > repCap) {
            // After cap: project weight increase
            const inc = getWeightIncrement(realPoints);
            const newKg = snap((lastPoint.kg || kgs[kgs.length - 1] || 0) + inc * Math.ceil((nextRep - repCap) / (repCap - lastPoint.reps + 1)));
            projKg = snap(newKg);
          } else {
            projKg = kgs.length > 0 ? Math.max(...kgs) : 0;
          }
          projReps = projVal;
        } else {
          // True bodyweight or no rep cap — just increase reps
          projVal = lastPoint.reps + i;
          if (repCap > 0) projVal = Math.min(projVal, repCap);
        }
      } else {
        projVal = snap(lastPoint.kg + rate * i);
        projKg = projVal;
      }
      d.push({
        session: realPoints.length + i,
        date: null, dateShort: '',
        valStatic: null, valNew: null,
        projVal,
        ...(projKg != null ? { projKg } : {}),
        ...(projReps != null ? { projReps } : {}),
        projected: true,
      });
    }

    // Y-axis ticks
    const vals = d.filter(x => !x.projected).map(x => x.valNew ?? x.valStatic).filter(v => v != null);
    d.filter(x => x.projected).forEach(x => { if (x.projVal != null) vals.push(x.projVal); });
    if (goal) {
      const goalVal = chartView === 'reps' ? goal.reps : goal.kg;
      if (goalVal > 0) vals.push(goalVal);
    }
    const rMin = Math.min(...vals), rMax = Math.max(...vals);
    let tMin, tMax, tStep;
    if (isBodyweight) {
      tMin = Math.floor(rMin); tMax = Math.ceil(rMax);
      tStep = Math.max(1, Math.round((tMax - tMin || 1) / 4));
    } else {
      const rough = (rMax - rMin) / 4;
      tStep = [5, 10, 20].reduce((best, s) => Math.abs(s - rough) < Math.abs(best - rough) ? s : best, 5);
      tMin = Math.floor(rMin / tStep) * tStep;
      tMax = Math.ceil(rMax / tStep) * tStep;
    }
    const ticks = [];
    for (let i = tMin; i <= tMax; i += tStep) ticks.push(i);
    if (ticks[ticks.length - 1] < tMax) ticks.push(tMax);

    return { data: d, yTicks: ticks, yMin: tMin, yMax: tMax, yStep: tStep, lastRealIdx: idx };
  }, [history, isBodyweight, exerciseName, goal, chartView]);

  if (result.empty) return null;
  const { data, yTicks, yMin, yMax, yStep, lastRealIdx } = result;

  const StaticDot = (props) => {
    const { cx, cy, value } = props;
    if (value == null) return <g />;
    return <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} />;
  };

  const NewDot = (props) => {
    const { cx, cy, index, value } = props;
    if (value == null) return <g />;
    const isNewest = index === lastRealIdx;
    if (isNewest) {
      if (freshAnim && animDir === 'remove') {
        return <circle key={`dot-${animKey}`} cx={cx} cy={cy} r={4} fill="#d4a017" stroke="white" strokeWidth={2} className="retract-dot" />;
      }
      if (freshAnim && animDir === 'add') {
        return (
          <g key={`dot-${animKey}`}>
            <circle cx={cx} cy={cy} r={4} fill="#d4a017" stroke="white" strokeWidth={2} className="snap-dot" />
            <circle cx={cx} cy={cy} r={4} className="ripple-ring" />
          </g>
        );
      }
      return <circle key={`dot-static-${animKey}`} cx={cx} cy={cy} r={4} fill="#d4a017" stroke="white" strokeWidth={2} />;
    }
    return <g />;
  };

  const GhostDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload?.projected) return <g />;
    return <circle cx={cx} cy={cy} r={5} fill="white" fillOpacity={0.6} stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />;
  };



  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (d.projected) {
      let label;
      if (d.projKg != null && d.projReps != null) {
        label = `Aim for: ${d.projKg} kg × ${d.projReps} reps`;
      } else if (d.projKg != null) {
        label = `Aim for: ${d.projKg} kg`;
      } else {
        label = `Aim for: ${d.projVal} reps`;
      }
      return (
        <div className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-md shadow-md text-xs font-semibold whitespace-nowrap">
          {label}
        </div>
      );
    }
    const val = d?.valNew ?? d?.valStatic;
    if (val == null) return null;
    const label = isBodyweight
      ? `${d.reps} reps`
      : `${d.kg} kg × ${d.reps} reps`;
    return (
      <div className="bg-white text-gray-800 px-3 py-1.5 rounded-md shadow-md text-xs font-semibold whitespace-nowrap text-center">
        <div>{label}</div>
        {d.date && <div className="text-[10px] font-normal text-gray-500 mt-0.5">{d.date}</div>}
      </div>
    );
  };

  const yDomain = [yMin - yStep, yMax + yStep];

  const pointWidth = 50;
  const chartWidth = Math.max(280, data.length * pointWidth);

  return (
    <div className={`rounded-xl overflow-hidden ${animDir === 'remove' ? 'new-seg-out' : 'new-seg-in'}`} style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', padding: '12px 4px 8px' }}>
      {!hideLabel && (
        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider text-center mb-2">
          {labelOverride || (isBodyweight ? 'Reps Progress' : 'Weight Progress (kg)')}
        </p>
      )}
      <div className="overflow-x-auto overflow-y-hidden" style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}>
          <LineChart width={chartWidth} height={compact ? 130 : 200} data={data} margin={{ top: 12, right: 16, left: -24, bottom: 4 }}>
          <YAxis domain={yDomain} ticks={yTicks} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="valStatic" stroke="#3b82f6" strokeWidth={2} dot={<StaticDot />} activeDot={false} connectNulls={false} isAnimationActive={false} />
          <Line key={animKey} type="monotone" dataKey="valNew" stroke="#3b82f6" strokeWidth={2} dot={<NewDot />} activeDot={{ r: 6, fill: '#d4a017', stroke: '#fff', strokeWidth: 2 }} connectNulls={true} isAnimationActive={true} animationDuration={600} animationEasing="ease-out" />
          <Line type="monotone" dataKey="projVal" stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} dot={<GhostDot />} activeDot={{ r: 5, fill: '#a78bfa', stroke: '#fff', strokeWidth: 2 }} connectNulls={true} isAnimationActive={false} />
          {goal && (() => {
            const goalVal = chartView === 'reps' ? goal.reps : goal.kg;
            if (!goalVal || goalVal <= 0) return null;
            return (
              <ReferenceLine
                y={goalVal}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="6 3"
                label={{ value: `🎯 ${goalVal}${chartView === 'reps' ? ' reps' : ' kg'}`, position: 'insideTopRight', fontSize: 10, fill: '#22c55e', fontWeight: 700 }}
              />
            );
          })()}
          </LineChart>
      </div>
    </div>
  );
});

export default ProgressGraph;