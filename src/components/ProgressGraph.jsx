import { useState, useEffect, useRef, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area } from 'recharts';

const punchDotStyle = `
  @keyframes dotSnapIn {
    0%   { transform: scale(0); opacity: 0; }
    65%  { transform: scale(1.25); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes dotRipple {
    0%   { r: 5;  opacity: 0.8; stroke-width: 2; }
    100% { r: 18; opacity: 0;   stroke-width: 0.5; }
  }
  @keyframes dotRetract {
    0%   { transform: scale(1); opacity: 1; }
    30%  { transform: scale(1.2); }
    100% { transform: scale(0); opacity: 0; }
  }
  @keyframes segmentFadeIn  { from { opacity: 0; } to { opacity: 1; } }
  @keyframes segmentFadeOut { from { opacity: 1; } to { opacity: 0; } }
  .snap-dot    { transform-box: fill-box; transform-origin: center; animation: dotSnapIn  0.4s cubic-bezier(0.34,1.56,0.64,1) forwards !important; animation-iteration-count: 1 !important; }
  .ripple-ring { animation: dotRipple  0.65s ease-out forwards !important; animation-iteration-count: 1 !important; fill: none; stroke: #3b82f6; }
  .retract-dot { transform-box: fill-box; transform-origin: center; animation: dotRetract 0.35s cubic-bezier(0.55,0,1,0.45) forwards !important; animation-iteration-count: 1 !important; }
  .new-seg-in  { animation: segmentFadeIn  0.5s ease forwards; }
  .new-seg-out { animation: segmentFadeOut 0.35s ease forwards; }
`;

function StatBadge({ label, value, accent }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-lg font-bold ${accent || 'text-foreground'}`}>{value}</span>
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function ProgressGraph({ history, animKey, animDir, isBodyweight, hideLabel }) {
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

  // PR detection — track every time the user hit a new personal best
  const prIndices = [];
  let runningMax = -Infinity;
  realPoints.forEach((p, i) => {
    const v = getValue(p);
    if (v > runningMax) {
      runningMax = v;
      prIndices.push(i);
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Chart data — use dates where available, fall back to session number
  const data = realPoints.map((p, i) => ({
    label: p.date ? formatDate(p.date) : `#${i + 1}`,
    date: p.date ? formatDate(p.date) : null,
    session: i + 1,
    valStatic: i < lastRealIdx ? getValue(p) : null,
    valNew: i >= lastRealIdx - 1 ? getValue(p) : null,
    prVal: prIndices.includes(i) ? getValue(p) : null,
    projVal: i === lastRealIdx ? getValue(p) : null,
    isPR: prIndices.includes(i),
  }));
  data.push({
    label: null,
    session: realPoints.length + 1,
    date: null,
    valStatic: null,
    valNew: null,
    prVal: null,
    projVal: isBodyweight ? lastPoint.reps + 1 : lastPoint.kg,
    projected: true,
    isPR: false,
  });

  // Linear regression trend line
  const n = realPoints.length;
  const xVals = realPoints.map((_, i) => i);
  const yVals = realPoints.map(p => getValue(p));
  const meanX = xVals.reduce((a, b) => a + b, 0) / n;
  const meanY = yVals.reduce((a, b) => a + b, 0) / n;
  const num = xVals.reduce((s, x, i) => s + (x - meanX) * (yVals[i] - meanY), 0);
  const den = xVals.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  const intercept = meanY - slope * meanX;
  const trendData = [
    { session: 1, trend: intercept },
    { session: n + 1, trend: intercept + slope * n },
  ];

  // Stats
  const values = realPoints.map(p => getValue(p));
  const maxVal = Math.max(...values);
  const avgVal = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const change = lastVal - firstVal;
  const sessions = values.length;

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
        return <circle key={`dot-${animKey}`} cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} className="retract-dot" />;
      }
      if (freshAnim && animDir === 'add') {
        return (
          <g key={`dot-${animKey}`}>
            <circle cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} className="snap-dot" />
            <circle cx={cx} cy={cy} r={4} className="ripple-ring" />
          </g>
        );
      }
      return <circle key={`dot-static-${animKey}`} cx={cx} cy={cy} r={4} fill="#3b82f6" stroke="white" strokeWidth={2} />;
    }
    return <g />;
  };

  const PRDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload?.isPR || payload?.projected) return <g />;
    return (
      <g>
        <circle cx={cx} cy={cy - 10} r={11} fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} opacity={0.9} />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={13} fill="#f59e0b" style={{ fontWeight: 700 }}>★</text>
      </g>
    );
  };

  const GhostDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload?.projected) return <g />;
    return <circle cx={cx} cy={cy} r={5} fill="white" fillOpacity={0.6} stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const val = d?.projected ? d.projVal : (d?.valNew ?? d?.valStatic);
    if (val == null) return null;
    const isPRPoint = d?.isPR && !d?.projected;
    return (
      <div className={`text-xs px-2.5 py-2 rounded-xl shadow-lg font-semibold flex flex-col gap-1 ${d?.projected ? 'bg-purple-50 text-purple-500 border border-purple-100' : 'bg-white text-gray-700 border border-gray-100'}`}>
        <span className="flex items-center gap-1">
          {d?.projected ? 'Next: ' : ''}{isBodyweight ? `${val} reps` : `${val} kg`}
          {isPRPoint && <span className="text-yellow-500 ml-0.5">★</span>}
        </span>
        {d?.date && <span className="text-[10px] font-normal text-gray-400">{d.date}</span>}
      </div>
    );
  };

  return (
    <div className={`rounded-xl overflow-hidden ${animDir === 'remove' ? 'new-seg-out' : 'new-seg-in'}`}>
      <style>{punchDotStyle}</style>
      <div style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', padding: '14px 8px 4px' }}>
        {!hideLabel && (
          <p className="text-xs font-bold text-blue-500 uppercase tracking-wider text-center mb-2">
            {isBodyweight ? 'Reps Progress' : 'Weight Progress (kg)'}
          </p>
        )}
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 16, right: 16, left: -20, bottom: 4 }}>
            <defs>
              <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval="preserveStartEnd" padding={{ left: 4, right: 4 }} />
            <Tooltip content={<CustomTooltip />} />
            {/* Gradient fill */}
            <Area type="monotone" dataKey="valNew" fill="url(#progressGradient)" stroke="none" connectNulls={true} isAnimationActive={false} />
            {/* Main historical line (static) */}
            <Line type="monotone" dataKey="valStatic" stroke="#3b82f6" strokeWidth={2.5} dot={<StaticDot />} activeDot={false} connectNulls={false} isAnimationActive={false} />
            {/* Animated recent segment */}
            <Line key={animKey} type="monotone" dataKey="valNew" stroke="#3b82f6" strokeWidth={2.5} dot={<NewDot />} activeDot={false} connectNulls={true} isAnimationActive={true} animationDuration={600} animationEasing="ease-out" />
            {/* Trend line */}
            <Line data={trendData} type="linear" dataKey="trend" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={false} isAnimationActive={false} opacity={0.7} />
            {/* PR markers */}
            <Line type="monotone" dataKey="prVal" stroke="transparent" strokeWidth={0} dot={<PRDot />} activeDot={false} connectNulls={false} isAnimationActive={false} />
            {/* Projection */}
            <Line type="monotone" dataKey="projVal" stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} dot={<GhostDot />} activeDot={false} connectNulls={true} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="flex justify-between items-center px-3 py-3 border-t border-border/50 bg-card">
        <StatBadge label="Best" value={maxVal} />
        <StatBadge label="Avg" value={avgVal} />
        <StatBadge label="Sessions" value={sessions} />
        <StatBadge
          label="Gain"
          value={`${change >= 0 ? '+' : ''}${change}`}
          accent={change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-400' : 'text-muted-foreground'}
        />
      </div>
    </div>
  );
}