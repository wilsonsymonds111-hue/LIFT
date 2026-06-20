import { memo, useMemo } from 'react';

const Sparkline = memo(function Sparkline({ data, width = 64, height = 32 }) {
  const points = useMemo(() => {
    if (!data?.length) return null;
    const values = data.map(d => d.v).filter(v => v != null);
    if (values.length === 0) return null;

    const PAD = 4;
    const innerW = width - PAD * 2;
    const innerH = height - PAD * 2;

    // Project 2 goal points following the trend
    const lastVal = values[values.length - 1];
    const trend = values.length > 1 ? (lastVal - values[0]) / (values.length - 1) : 1;
    const goalVals = [lastVal + trend, lastVal + trend * 2];

    const allVals = [...values, ...goalVals];
    const max = Math.max(...allVals);
    const min = Math.min(...allVals);
    const range = max - min || 1;

    const total = allVals.length;
    const stepX = total === 1 ? 0 : innerW / (total - 1);

    const getXY = (v, i) => {
      const x = PAD + (total === 1 ? innerW / 2 : i * stepX);
      const y = PAD + innerH - ((v - min) / range) * innerH;
      return { x, y };
    };

    const actual = values.map((v, i) => getXY(v, i));
    const goals = goalVals.map((v, i) => getXY(v, values.length + i));

    return { actual, goals, total };
  }, [data, width, height]);

  if (!points) return null;

  const { actual, goals } = points;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0 block" overflow="visible">
      {/* Solid blue line for actual data */}
      <polyline
        points={actual.map(p => `${p.x},${p.y}`).join(' ')}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dashed purple line from last actual to goals */}
      {goals.length > 0 && (
        <polyline
          points={[actual[actual.length - 1], ...goals].map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#c4b5fd"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity={0.6}
        />
      )}

      {/* Actual dots — blue, last one gold (PR) */}
      {actual.map((p, i) => {
        const isPR = i === actual.length - 1;
        return (
          <circle
            key={`a-${i}`}
            cx={p.x}
            cy={p.y}
            r={isPR ? 2.5 : 1.8}
            fill={isPR ? '#d4a017' : '#3b82f6'}
            stroke="white"
            strokeWidth={0.8}
          />
        );
      })}

      {/* Goal dots — empty with dashed purple border */}
      {goals.map((p, i) => (
        <circle
          key={`g-${i}`}
          cx={p.x}
          cy={p.y}
          r={2.8}
          fill="white"
          fillOpacity={0.6}
          stroke="#c4b5fd"
          strokeWidth={1}
          strokeDasharray="2 1.5"
          opacity={0.7}
        />
      ))}
    </svg>
  );
});

export default Sparkline;