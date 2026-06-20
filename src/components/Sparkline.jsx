import { memo, useMemo } from 'react';

const MAX_POINTS = 6;
const MAX_BEFORE_PR = 4;

const Sparkline = memo(function Sparkline({ data, width = 64, height = 32 }) {
  const points = useMemo(() => {
    if (!data?.length) return null;
    const values = data.map(d => d.v).filter(v => v != null);
    if (values.length === 0) return null;

    // Find PR (max value) — use last occurrence if tied
    const maxVal = Math.max(...values);
    let prIndex = values.length - 1;
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] === maxVal) { prIndex = i; break; }
    }

    // Take up to MAX_BEFORE_PR most recent points before PR
    const beforeCount = Math.min(MAX_BEFORE_PR, prIndex);
    const beforeVals = values.slice(prIndex - beforeCount, prIndex);

    // PR value
    const prVal = values[prIndex];

    // Goal points fill remaining slots up to MAX_POINTS
    const usedSoFar = beforeVals.length + 1; // before + PR
    const goalCount = Math.max(1, MAX_POINTS - usedSoFar);

    // Calculate trend for projections
    const trend = beforeVals.length > 0
      ? (prVal - beforeVals[0]) / beforeCount
      : 1;
    const goalVals = [];
    for (let i = 1; i <= goalCount; i++) {
      goalVals.push(prVal + Math.max(trend, 0.5) * i);
    }

    const allVals = [...beforeVals, prVal, ...goalVals];
    const max = Math.max(...allVals);
    const min = Math.min(...allVals);
    const range = max - min || 1;

    const PAD = 4;
    const innerW = width - PAD * 2;
    const innerH = height - PAD * 2;
    const total = allVals.length;
    const stepX = total === 1 ? 0 : innerW / Math.max(total - 1, 1);

    const getXY = (v, i) => ({
      x: PAD + (total === 1 ? innerW / 2 : i * stepX),
      y: PAD + innerH - ((v - min) / range) * innerH,
    });

    const actualPts = allVals.map((v, i) => getXY(v, i));
    const prIdxInAll = beforeVals.length;

    return { actualPts, prIdxInAll, beforeCount: beforeVals.length };
  }, [data, width, height]);

  if (!points) return null;
  const { actualPts, prIdxInAll, beforeCount } = points;

  const bluePts = actualPts.slice(0, prIdxInAll);
  const prPt = actualPts[prIdxInAll];
  const goalPts = actualPts.slice(prIdxInAll + 1);

  const solidLinePts = [...bluePts, prPt];
  const solidPoints = solidLinePts.map(p => `${p.x},${p.y}`).join(' ');

  const dashedLinePts = [prPt, ...goalPts];
  const dashedPoints = dashedLinePts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0 block" overflow="visible">
      {/* Solid blue line for actual + PR */}
      {solidLinePts.length > 1 && (
        <polyline
          points={solidPoints}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* Dashed purple line from PR to goals */}
      {goalPts.length > 0 && (
        <polyline
          points={dashedPoints}
          fill="none"
          stroke="#c4b5fd"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity={0.6}
        />
      )}

      {/* Blue data dots (history before PR) */}
      {bluePts.map((p, i) => (
        <circle
          key={`b-${i}`}
          cx={p.x}
          cy={p.y}
          r={1.8}
          fill="#3b82f6"
          stroke="white"
          strokeWidth={0.8}
        />
      ))}

      {/* Gold PR dot */}
      {prPt && (
        <circle
          cx={prPt.x}
          cy={prPt.y}
          r={2.5}
          fill="#d4a017"
          stroke="white"
          strokeWidth={0.8}
        />
      )}

      {/* Goal dots — empty with dashed purple border */}
      {goalPts.map((p, i) => (
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