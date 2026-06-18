import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const punchDotStyle = `
  @keyframes dotSnapIn {
    0%   { transform: scale(0); opacity: 0; }
    65%  { transform: scale(1.25); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes dotRipple {
    0%   { r: 4;  opacity: 0.8; stroke-width: 2; }
    100% { r: 16; opacity: 0;   stroke-width: 0.5; }
  }
  @keyframes dotRetract {
    0%   { transform: scale(1); opacity: 1; }
    30%  { transform: scale(1.2); }
    100% { transform: scale(0); opacity: 0; }
  }
  @keyframes segmentFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes segmentFadeOut { from { opacity: 1; } to { opacity: 0; } }
  .snap-dot    { transform-box: fill-box; transform-origin: center; animation: dotSnapIn  0.4s cubic-bezier(0.34,1.56,0.64,1) forwards !important; animation-iteration-count: 1 !important; }
  .ripple-ring { animation: dotRipple  0.65s ease-out forwards !important; animation-iteration-count: 1 !important; fill: none; stroke: #d4a017; }
  .retract-dot { transform-box: fill-box; transform-origin: center; animation: dotRetract 0.35s cubic-bezier(0.55,0,1,0.45) forwards !important; animation-iteration-count: 1 !important; }
  .new-seg-in  { animation: segmentFadeIn  0.5s ease forwards; }
  .new-seg-out { animation: segmentFadeOut 0.35s ease forwards; }
`;

export default function ProgressGraph({ history, animKey, animDir, isBodyweight, hideLabel, labelOverride }) {
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

  if (!history || history.length === 0) return null;

  const toPoint = (h) => typeof h === 'object' ? h : { kg: h, reps: 8 };
  const realPoints = history.map(toPoint);
  const lastPoint = realPoints[realPoints.length - 1];
  const lastRealIdx = realPoints.length - 1;

  const getValue = (p) => isBodyweight ? p.reps : p.kg;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { month: 'short' });
  };

  const data = realPoints.map((p, i) => ({
    session: i + 1,
    date: p.date ? formatDate(p.date) : null,
    dateShort: formatDateShort(p.date),
    valStatic: i < lastRealIdx ? getValue(p) : null,
    valNew: i >= lastRealIdx - 1 ? getValue(p) : null,
    projVal: i === lastRealIdx ? getValue(p) : null,
    kg: p.kg,
    reps: p.reps,
  }));

  // Deduplicate repeated month labels — show each month only once
  let lastShort = null;
  data.forEach(d => {
    if (d.dateShort) {
      if (d.dateShort === lastShort) {
        d.dateShort = '';
      } else {
        lastShort = d.dateShort;
      }
    }
  });

  // Generate 6 AI-projected future data points
  const projectionCount = 6;
  for (let i = 1; i <= projectionCount; i++) {
    data.push({
      session: realPoints.length + i,
      date: null,
      dateShort: '',
      valStatic: null,
      valNew: null,
      projVal: isBodyweight ? lastPoint.reps + i : lastPoint.kg,
      projected: true,
    });
  }

  // Compute nice evenly-spaced Y-axis ticks
  const allVals = data
    .filter(d => !d.projected)
    .map(d => d.valNew ?? d.valStatic)
    .filter(v => v != null);
  data.filter(d => d.projected).forEach(d => {
    if (d.projVal != null) allVals.push(d.projVal);
  });
  const rawMin = Math.min(...allVals);
  const rawMax = Math.max(...allVals);
  let yMin, yMax, yStep;

  if (isBodyweight) {
    // Reps chart: use integer increments
    yMin = Math.floor(rawMin);
    yMax = Math.ceil(rawMax);
    const yRange = yMax - yMin || 1;
    yStep = Math.max(1, Math.round(yRange / 4));
  } else {
    // Weight chart: snap to 5, 10, or 20 kg increments
    const roughStep = (rawMax - rawMin) / 4;
    yStep = [5, 10, 20].reduce((best, s) => Math.abs(s - roughStep) < Math.abs(best - roughStep) ? s : best, 5);
    yMin = Math.floor(rawMin / yStep) * yStep;
    yMax = Math.ceil(rawMax / yStep) * yStep;
  }

  const yTicks = [];
  for (let i = yMin; i <= yMax; i += yStep) yTicks.push(i);
  if (yTicks[yTicks.length - 1] < yMax) yTicks.push(yMax);

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
    if (d?.projected) return null;
    const val = d?.valNew ?? d?.valStatic;
    if (val == null) return null;
    const label = isBodyweight
      ? `${d.reps} reps`
      : `${d.kg} kg × ${d.reps} reps`;
    return (
      <div className="bg-white text-gray-800 px-3 py-1.5 rounded-md shadow-md text-xs font-semibold whitespace-nowrap">
        {label}
      </div>
    );
  };

  return (
    <div className={`rounded-xl overflow-hidden ${animDir === 'remove' ? 'new-seg-out' : 'new-seg-in'}`} style={{       background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', padding: '12px 4px 8px' }}>
      <style>{punchDotStyle}</style>
      {!hideLabel && (
        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider text-center mb-2">
          {labelOverride || (isBodyweight ? 'Reps Progress' : 'Weight Progress (kg)')}
        </p>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 12, right: 16, left: -24, bottom: 4 }}>
          <YAxis domain={[yMin - yStep, yMax + yStep]} ticks={yTicks} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="valStatic" stroke="#3b82f6" strokeWidth={2} dot={<StaticDot />} activeDot={false} connectNulls={false} isAnimationActive={false} />
          <Line key={animKey} type="monotone" dataKey="valNew" stroke="#3b82f6" strokeWidth={2} dot={<NewDot />} activeDot={{ r: 6, fill: '#d4a017', stroke: '#fff', strokeWidth: 2 }} connectNulls={true} isAnimationActive={true} animationDuration={600} animationEasing="ease-out" />
          <Line type="monotone" dataKey="projVal" stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} dot={<GhostDot />} activeDot={false} connectNulls={true} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}