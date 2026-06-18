import { useState, useEffect, useRef, useMemo, memo } from 'react';
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

const ProgressGraph = memo(function ProgressGraph({ history, animKey, animDir, isBodyweight, hideLabel, labelOverride, compact }) {
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

    for (let i = 1; i <= 6; i++) {
      d.push({
        session: realPoints.length + i,
        date: null, dateShort: '',
        valStatic: null, valNew: null,
        projVal: isBodyweight ? lastPoint.reps + i : snap(lastPoint.kg + rate * i),
        projected: true,
      });
    }

    // Y-axis ticks
    const vals = d.filter(x => !x.projected).map(x => x.valNew ?? x.valStatic).filter(v => v != null);
    d.filter(x => x.projected).forEach(x => { if (x.projVal != null) vals.push(x.projVal); });
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
  }, [history, isBodyweight]);

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
      const label = isBodyweight
        ? `Aim for: ${d.projVal} reps`
        : `Aim for: ${d.projVal} kg`;
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
      <div className="bg-white text-gray-800 px-3 py-1.5 rounded-md shadow-md text-xs font-semibold whitespace-nowrap">
        {label}
      </div>
    );
  };

  const yDomain = [yMin - yStep, yMax + yStep];

  return (
    <div className={`rounded-xl overflow-hidden ${animDir === 'remove' ? 'new-seg-out' : 'new-seg-in'}`} style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', padding: '12px 4px 8px' }}>
      <style>{punchDotStyle}</style>
      {!hideLabel && (
        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider text-center mb-2">
          {labelOverride || (isBodyweight ? 'Reps Progress' : 'Weight Progress (kg)')}
        </p>
      )}
      <ResponsiveContainer width="100%" height={compact ? 130 : 200}>
        <LineChart data={data} margin={{ top: 12, right: 16, left: -24, bottom: 4 }}>
          <YAxis domain={yDomain} ticks={yTicks} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="valStatic" stroke="#3b82f6" strokeWidth={2} dot={<StaticDot />} activeDot={false} connectNulls={false} isAnimationActive={false} />
          <Line key={animKey} type="monotone" dataKey="valNew" stroke="#3b82f6" strokeWidth={2} dot={<NewDot />} activeDot={{ r: 6, fill: '#d4a017', stroke: '#fff', strokeWidth: 2 }} connectNulls={true} isAnimationActive={true} animationDuration={600} animationEasing="ease-out" />
          <Line type="monotone" dataKey="projVal" stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} dot={<GhostDot />} activeDot={{ r: 5, fill: '#a78bfa', stroke: '#fff', strokeWidth: 2 }} connectNulls={true} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

export default ProgressGraph;