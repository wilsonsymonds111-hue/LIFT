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
  .ripple-ring { animation: dotRipple  0.65s ease-out forwards !important; animation-iteration-count: 1 !important; fill: none; stroke: #3b82f6; }
  .retract-dot { transform-box: fill-box; transform-origin: center; animation: dotRetract 0.35s cubic-bezier(0.55,0,1,0.45) forwards !important; animation-iteration-count: 1 !important; }
  .new-seg-in  { animation: segmentFadeIn  0.5s ease forwards; }
  .new-seg-out { animation: segmentFadeOut 0.35s ease forwards; }
`;

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

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d) ? null : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const data = realPoints.map((p, i) => ({
    session: i + 1,
    date: p.date ? formatDate(p.date) : null,
    dateShort: formatDateShort(p.date),
    valStatic: i < lastRealIdx ? getValue(p) : null,
    valNew: i >= lastRealIdx - 1 ? getValue(p) : null,
    projVal: i === lastRealIdx ? getValue(p) : null,
  }));
  const nextSeshLabel = formatDateShort(realPoints[lastRealIdx]?.date);
  data.push({
    session: realPoints.length + 1,
    date: null,
    dateShort: 'Next',
    valStatic: null,
    valNew: null,
    projVal: isBodyweight ? lastPoint.reps + 1 : lastPoint.kg,
    projected: true,
  });

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

  const GhostDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload?.projected) return <g />;
    return <circle cx={cx} cy={cy} r={5} fill="white" fillOpacity={0.6} stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />;
  };

  const PRCallout = (props) => {
    const { viewBox, index } = props;
    if (index !== lastRealIdx) return null;
    const pt = realPoints[lastRealIdx];
    const label = isBodyweight ? `${pt.reps} reps` : `${pt.kg} kg × ${pt.reps} reps`;
    return (
      <g transform={`translate(${viewBox.x}, ${viewBox.y})`}>
        <rect x={-30} y={-32} width={60} height={24} rx={8} fill="#1e40af" />
        <text x={0} y={-15} textAnchor="middle" fill="#fff" fontSize={10} fontWeight={700}>{label}</text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    const val = d?.projected ? d.projVal : (d?.valNew ?? d?.valStatic);
    if (val == null) return null;
    return (
      <div className={`text-xs px-2 py-1.5 rounded-lg shadow font-semibold flex flex-col gap-0.5 ${d?.projected ? 'bg-purple-50 text-purple-400 border border-purple-100' : 'bg-white text-gray-700 border border-gray-100'}`}>
        <span>{d?.projected ? 'Next: ' : ''}{isBodyweight ? `${val} reps` : `${val} kg`}</span>
        {d?.dateShort && <span className="text-[10px] font-normal text-gray-400">{d.dateShort}</span>}
      </div>
    );
  };

  return (
    <div className={`rounded-xl overflow-hidden ${animDir === 'remove' ? 'new-seg-out' : 'new-seg-in'}`} style={{       background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', padding: '12px 4px 8px' }}>
      <style>{punchDotStyle}</style>
      {!hideLabel && (
        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider text-center mb-2">
          {isBodyweight ? 'Reps Progress' : 'Weight Progress (kg)'}
        </p>
      )}
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 12, right: 16, left: -24, bottom: 4 }}>
          <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="valStatic" stroke="#3b82f6" strokeWidth={2} dot={<StaticDot />} activeDot={false} connectNulls={false} isAnimationActive={false} />
          <Line key={animKey} type="monotone" dataKey="valNew" stroke="#3b82f6" strokeWidth={2} dot={<NewDot />} activeDot={false} connectNulls={true} isAnimationActive={true} animationDuration={600} animationEasing="ease-out" label={<PRCallout />} />
          <Line type="monotone" dataKey="projVal" stroke="#c4b5fd" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} dot={<GhostDot />} activeDot={false} connectNulls={true} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}