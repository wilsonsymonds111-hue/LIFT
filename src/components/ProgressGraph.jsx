import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

// Exercise classification helpers — exported for use in other components
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

const StaticDot = (props) => {
  const { cx, cy, value } = props;
  if (value == null) return <g />;
  return <circle cx={cx} cy={cy} r={3} fill="#fff" stroke="#3b82f6" strokeWidth={2} />;
};

const ProgressGraph = memo(function ProgressGraph({ history, animKey, animDir, isBodyweight, hideLabel, labelOverride, compact, exerciseName, goal }) {
  const [freshAnim, setFreshAnim] = useState(false);
  const prevAnimKeyRef = useRef(animKey);
  const chartHeight = compact ? 140 : 230;

  // Animation trigger
  useEffect(() => {
    if (animKey !== prevAnimKeyRef.current) {
      prevAnimKeyRef.current = animKey;
      setFreshAnim(true);
      const t = setTimeout(() => setFreshAnim(false), 650);
      return () => clearTimeout(t);
    }
  }, [animKey]);

  // Data computation — real points only, no projections
  const result = useMemo(() => {
    if (!history || history.length === 0) return { empty: true };
    const toPoint = (h) => typeof h === 'object' ? h : { kg: h, reps: 8 };
    let allPoints = history.map(toPoint);

    // Show every data point — no averaging or aggregation

    const getValue = (p) => isBodyweight ? p.reps : p.kg;
    const idx = allPoints.length - 1;

    const formatDateShort = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { month: 'short' });
    };

    const d = allPoints.map((p, i) => ({
      date: p.date ? (() => { const dt = new Date(p.date); return isNaN(dt) ? null : dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); })() : null,
      dateShort: formatDateShort(p.date),
      valStatic: i < idx ? getValue(p) : null,
      valNew: i >= idx - 1 ? getValue(p) : null,
      kg: p.kg,
      reps: p.reps,
    }));

    // Deduplicate consecutive month labels
    let lastShort = null;
    d.forEach(item => {
      if (item.dateShort) {
        if (item.dateShort === lastShort) { item.dateShort = ''; }
        else { lastShort = item.dateShort; }
      }
    });

    // Append a single goal point (next progressive overload target) if provided
    if (goal) {
      const goalVal = isBodyweight ? (goal.reps ?? 0) : (goal.kg ?? 0);
      if (goalVal > 0 && d.length > 0) {
        const lastIdx = d.length - 1;
        d[lastIdx] = { ...d[lastIdx], valGoal: d[lastIdx].valNew ?? d[lastIdx].valStatic };
        d.push({
          date: null,
          dateShort: '',
          valStatic: null,
          valNew: null,
          valGoal: goalVal,
          kg: goal.kg,
          reps: goal.reps,
          isGoal: true,
        });
      }
    }

    return { data: d, lastRealIdx: idx };
  }, [history, isBodyweight, goal]);

  // Y-axis domain — ticks always in increments of 5 or 10 kg for clean, even spacing
  const { domain: yDomain, ticks: yTicks } = useMemo(() => {
    if (!result.data || result.data.length === 0) return { domain: [0, 100], ticks: [] };
    const vals = result.data.map(x => x.valStatic ?? x.valNew ?? x.valGoal).filter(v => v != null);
    if (vals.length === 0) return { domain: [0, 100], ticks: [] };
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const padding = Math.max((max - min) * 0.1, 2.5);
    const rangeMin = min - padding;
    const rangeMax = max + padding;
    const span = rangeMax - rangeMin;
    // Pick 2.5, 5, or 10 as the step — whichever gives ~3-6 ticks
    const step = span <= 15 ? 2.5 : span <= 50 ? 5 : 10;
    const niceMin = Math.floor(rangeMin / step) * step;
    const niceMax = Math.ceil(rangeMax / step) * step;
    const ticks = [];
    for (let v = niceMin; v <= niceMax + step / 2; v += step) ticks.push(v);
    return { domain: [niceMin, niceMax], ticks };
  }, [result.data]);

  const { data, lastRealIdx } = result;

  const renderNewDot = useCallback((props) => {
    const { cx, cy, index, value } = props;
    if (value == null) return <g />;
    if (lastRealIdx == null) return <circle cx={cx} cy={cy} r={3} fill="#fff" stroke="#3b82f6" strokeWidth={2} />;
    const isNewest = index === lastRealIdx;
    if (isNewest) {
      if (freshAnim && animDir === 'remove') {
        return <circle key={`dot-${animKey}`} cx={cx} cy={cy} r={4} fill="#fff" stroke="#3b82f6" strokeWidth={2} className="retract-dot" />;
      }
      if (freshAnim && animDir === 'add') {
        return (
          <g key={`dot-${animKey}`}>
            <circle cx={cx} cy={cy} r={4} fill="#fff" stroke="#3b82f6" strokeWidth={2} className="snap-dot" />
            <circle cx={cx} cy={cy} r={4} className="ripple-ring" />
          </g>
        );
      }
      return <circle key={`dot-static-${animKey}`} cx={cx} cy={cy} r={4} fill="#fff" stroke="#3b82f6" strokeWidth={2} />;
    }
    return <circle cx={cx} cy={cy} r={3} fill="#fff" stroke="#3b82f6" strokeWidth={2} />;
  }, [freshAnim, animDir, animKey, lastRealIdx]);

  const renderGoalDot = useCallback((props) => {
    const { cx, cy, value, payload } = props;
    if (value == null || !payload?.isGoal) return <g />;
    return <circle cx={cx} cy={cy} r={5} fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="2.5 2.5" />;
  }, []);

  const renderTooltip = useCallback(({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (d?.isGoal) {
      const label = isBodyweight ? `${d.reps} reps` : `${d.kg} kg × ${d.reps} reps`;
      return (
        <div className="bg-white text-gray-800 px-3 py-1.5 rounded-md shadow-md text-xs font-semibold whitespace-nowrap text-center">
          <div>🎯 {label}</div>
          <div className="text-[10px] font-normal text-gray-500 mt-0.5">Next goal</div>
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
  }, [isBodyweight]);

  if (result.empty) return null;

  return (
    <div className={`rounded-xl overflow-hidden progress-graph-bg ${animDir === 'remove' ? 'new-seg-out' : 'new-seg-in'}`} style={{ padding: '12px 4px 8px' }}>
      {!hideLabel && (
        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider text-center mb-2">
          {labelOverride || (isBodyweight ? 'Reps Progress' : 'Weight Progress (kg)')}
        </p>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={data} margin={{ top: 20, right: 12, left: 0, bottom: 4 }}>
          <YAxis domain={yDomain} ticks={yTicks} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={36} allowDataOverflow />
          <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="equidistantPreserveStartEnd" minTickGap={20} />
          <Tooltip content={renderTooltip} />
          <Line type="monotone" dataKey="valStatic" stroke="#3b82f6" strokeWidth={2} dot={StaticDot} activeDot={false} connectNulls={false} isAnimationActive={false} />
          <Line key={animKey} type="monotone" dataKey="valNew" stroke="#3b82f6" strokeWidth={2} dot={renderNewDot} activeDot={{ r: 6, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }} connectNulls={true} isAnimationActive={true} animationDuration={300} animationEasing="ease-out" />
          <Line type="monotone" dataKey="valGoal" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="3 3" dot={renderGoalDot} activeDot={false} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ProgressGraph;