import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
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

const CHART_MARGIN = { top: 12, right: 16, left: 46, bottom: 4 };
const BASE_POINT_WIDTH = 50;
const Y_AXIS_WIDTH = 36;

const ProgressGraph = memo(function ProgressGraph({ history, animKey, animDir, isBodyweight, hideLabel, labelOverride, compact, exerciseName, goal, chartView, repsChartWeight }) {
  const [freshAnim, setFreshAnim] = useState(false);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const prevAnimKeyRef = useRef(animKey);
  const scrollRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startScroll: 0 });
  const pinchState = useRef({ pinching: false, startDist: 0, startZoom: 1 });
  const rafRef = useRef(null);
  const animYRafRef = useRef(null);
  const animYRef = useRef(null);
  const targetYRef = useRef(null);
  const [animatedY, setAnimatedY] = useState(null);

  const pointWidth = BASE_POINT_WIDTH * zoom;
  const chartHeight = compact ? 140 : 230;
  const repCap = exerciseName ? getRepCap(exerciseName) : 12;

  // Mouse drag-to-scroll
  const handleDragStart = (clientX) => {
    if (!scrollRef.current) return;
    dragState.current = { dragging: true, startX: clientX, startScroll: scrollRef.current.scrollLeft };
  };
  const handleDragMove = (clientX) => {
    if (!dragState.current.dragging || !scrollRef.current) return;
    scrollRef.current.scrollLeft = dragState.current.startScroll - (clientX - dragState.current.startX);
  };
  const handleDragEnd = () => { dragState.current.dragging = false; };

  // Pinch-to-zoom
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchState.current = { pinching: true, startDist: dist, startZoom: zoom };
    }
  };
  const handleTouchMove = (e) => {
    if (pinchState.current.pinching && e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchState.current.startDist > 0) {
        const scale = dist / pinchState.current.startDist;
        setZoom(Math.max(0.5, Math.min(3, pinchState.current.startZoom * scale)));
      }
    }
  };
  const handleTouchEnd = () => {
    pinchState.current = { pinching: false, startDist: 0, startZoom: 1 };
  };

  // Animation trigger
  useEffect(() => {
    if (animKey !== prevAnimKeyRef.current) {
      prevAnimKeyRef.current = animKey;
      setFreshAnim(true);
      const t = setTimeout(() => setFreshAnim(false), 650);
      return () => clearTimeout(t);
    }
  }, [animKey]);

  // Data computation (all real points + 4 projections)
  const result = useMemo(() => {
    if (!history || history.length === 0) return { empty: true };
    const toPoint = (h) => typeof h === 'object' ? h : { kg: h, reps: 8 };
    const allPoints = history.map(toPoint);
    const realPoints = allPoints;
    let projectionCount = Math.max(4, 9 - realPoints.length);
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

    let lastShort = null;
    d.forEach(item => {
      if (item.dateShort) {
        if (item.dateShort === lastShort) { item.dateShort = ''; }
        else { lastShort = item.dateShort; }
      }
    });

    const kgs = allPoints.map(p => p.kg || 0).filter(k => k > 0);
    let rate = 2.5;
    if (kgs.length >= 2) {
      const rawRate = (kgs[kgs.length - 1] - kgs[0]) / (kgs.length - 1);
      rate = rawRate > 0 ? rawRate : 2.5;
    }
    const snap = (v) => Math.round(v / 2.5) * 2.5;

    // Extend projections to reach the goal if set
    if (goal) {
      const goalVal = isBodyweight ? goal.reps : goal.kg;
      const lastVal = getValue(lastPoint);
      if (goalVal && goalVal > lastVal && rate > 0) {
        projectionCount = Math.max(projectionCount, Math.ceil((goalVal - lastVal) / rate));
      }
    }

    const repCap = exerciseName ? getRepCap(exerciseName) : 0;
    const hasWeights = kgs.length > 0;

    for (let i = 1; i <= projectionCount; i++) {
      let projVal, projKg, projReps;
      let shouldBreak = false;
      if (isBodyweight) {
        if (hasWeights && repCap > 0) {
          const nextRep = lastPoint.reps + i;
          projVal = Math.min(nextRep, repCap);
          projKg = kgs.length > 0 ? Math.max(...kgs) : 0;
          projReps = projVal;
          if (nextRep >= repCap) shouldBreak = true;
        } else {
          projVal = lastPoint.reps + i;
          if (repCap > 0) {
            projVal = Math.min(projVal, repCap);
            if (projVal >= repCap) shouldBreak = true;
          }
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
      if (shouldBreak) break;
    }

    return { data: d, lastRealIdx: idx };
  }, [history, isBodyweight, exerciseName, goal]);

  // Measure container width
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContainerWidth(el.clientWidth));
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // rAF-throttled scroll handler
  const handleScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (scrollRef.current) setScrollLeft(scrollRef.current.scrollLeft);
    });
  }, []);

  // Keep latest data in a ref so the scroll effect can read it without re-running on every render
  const dataRef = useRef(null);
  dataRef.current = result.data || null;

  // Initial scroll — center the most recent PR in the middle of the chart.
  // Depends on data length (a stable primitive) instead of the array reference,
  // so scrolling the chart doesn't trigger a re-center on every re-render.
  useEffect(() => {
    if (!scrollRef.current || !dataRef.current) return;
    const cw = scrollRef.current.clientWidth || containerWidth;
    if (cw === 0) return;
    const realCount = dataRef.current.filter(x => !x.projected).length;
    const lastRealIdx = realCount - 1;
    const chartW = Math.max(280, dataRef.current.length * pointWidth);
    const dataLen = dataRef.current.length;
    const spacing = dataLen > 1 ? (chartW - CHART_MARGIN.left - CHART_MARGIN.right) / (dataLen - 1) : 0;
    const prX = CHART_MARGIN.left + lastRealIdx * spacing;
    const maxScroll = Math.max(0, chartW - cw);
    const scrollTo = Math.max(0, Math.min(maxScroll, prX - cw / 2));
    scrollRef.current.scrollLeft = scrollTo;
    setScrollLeft(scrollTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result.data?.length, isBodyweight, exerciseName, pointWidth, containerWidth]);

  // Dynamic Y-axis domain based on visible data
  const visibleY = useMemo(() => {
    if (!result.data) return null;
    const cw = Math.max(280, result.data.length * pointWidth);
    const dataAreaWidth = cw - CHART_MARGIN.left - CHART_MARGIN.right;
    const spacing = result.data.length > 1 ? dataAreaWidth / (result.data.length - 1) : 0;

    let startIdx, endIdx;
    if (containerWidth === 0 || spacing === 0) {
      startIdx = 0;
      endIdx = result.data.length;
    } else {
      startIdx = Math.max(0, Math.floor((scrollLeft - CHART_MARGIN.left) / spacing));
      endIdx = Math.min(result.data.length, Math.ceil((scrollLeft + containerWidth - CHART_MARGIN.left) / spacing) + 1);
    }

    const visible = result.data.slice(startIdx, endIdx);
    const vals = visible.map(x => x.valNew ?? x.valStatic ?? x.projVal).filter(v => v != null);
    // Include goal value so the green target line stays in view
    if (goal) {
      const goalVal = isBodyweight ? goal.reps : goal.kg;
      if (goalVal && goalVal > 0) vals.push(goalVal);
    }
    if (vals.length === 0) return null;

    const rMin = Math.min(...vals), rMax = Math.max(...vals);
    let tMin, tMax, tStep;
    if (isBodyweight) {
      tMin = Math.floor(rMin); tMax = Math.ceil(rMax);
      tStep = Math.max(2, Math.round((tMax - tMin || 1) / 4));
    } else {
      tStep = 5; // Bigger increments
      tMin = Math.floor(rMin / tStep) * tStep;
      tMax = Math.ceil(rMax / tStep) * tStep;
      if (tMax - tMin < 2 * tStep) {
        const mid = Math.round(((tMin + tMax) / 2) / tStep) * tStep;
        tMin = mid - tStep;
        tMax = mid + tStep;
      }
    }
    const ticks = [];
    for (let i = tMin; i <= tMax; i += tStep) ticks.push(i);
    if (ticks[ticks.length - 1] < tMax) ticks.push(tMax);
    return { yMin: tMin, yMax: tMax, yStep: tStep, ticks };
  }, [result.data, scrollLeft, containerWidth, pointWidth, isBodyweight, goal]);

  // Smoothly animate Y-axis domain toward target on scroll
  useEffect(() => {
    if (!visibleY) return;
    targetYRef.current = visibleY;
    if (animYRafRef.current) return; // animation loop already running — it'll pick up the new target
    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      const target = targetYRef.current;
      if (!target) { animYRafRef.current = null; return; }
      const cur = animYRef.current;
      if (!cur) { animYRef.current = target; setAnimatedY(target); animYRafRef.current = null; return; }
      const speed = 0.22;
      let nyMin = lerp(cur.yMin, target.yMin, speed);
      let nyMax = lerp(cur.yMax, target.yMax, speed);
      const done = Math.abs(nyMin - target.yMin) < 0.3 && Math.abs(nyMax - target.yMax) < 0.3;
      if (done) { nyMin = target.yMin; nyMax = target.yMax; }
      const tStep = target.yStep;
      const tMin = Math.round(nyMin / tStep) * tStep;
      const tMax = Math.round(nyMax / tStep) * tStep;
      const ticks = [];
      for (let i = tMin; i <= tMax; i += tStep) ticks.push(i);
      const next = { yMin: nyMin, yMax: nyMax, yStep: tStep, ticks };
      animYRef.current = next;
      setAnimatedY(next);
      if (!done) animYRafRef.current = requestAnimationFrame(tick);
      else animYRafRef.current = null;
    };
    animYRafRef.current = requestAnimationFrame(tick);
  }, [visibleY]);

  useEffect(() => {
    return () => { if (animYRafRef.current) cancelAnimationFrame(animYRafRef.current); };
  }, []);

  if (result.empty) return null;
  const { data, lastRealIdx } = result;

  const yDomain = animatedY
    ? isBodyweight
      ? [animatedY.yMin - animatedY.yStep, animatedY.yMax + animatedY.yStep]
      : [animatedY.yMin - animatedY.yStep / 2, animatedY.yMax + animatedY.yStep / 2]
    : [0, 100];

  // Map Y value → pixel position for sticky overlay
  const chartAreaHeight = chartHeight - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const yToPixel = (v) => {
    const [lo, hi] = yDomain;
    if (hi === lo) return CHART_MARGIN.top + chartAreaHeight / 2;
    return CHART_MARGIN.top + (1 - (v - lo) / (hi - lo)) * chartAreaHeight;
  };

  const chartWidth = Math.max(280, data.length * pointWidth);

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
        return <circle key={`dot-${animKey}`} cx={cx} cy={cy} r={4.1} fill="#3b82f6" stroke="#3b82f6" strokeWidth={2.5} className="retract-dot" />;
      }
      if (freshAnim && animDir === 'add') {
        return (
          <g key={`dot-${animKey}`}>
            <circle cx={cx} cy={cy} r={4.1} fill="#3b82f6" stroke="#3b82f6" strokeWidth={2.5} className="snap-dot" />
            <circle cx={cx} cy={cy} r={4} className="ripple-ring" />
          </g>
        );
      }
      return <circle key={`dot-static-${animKey}`} cx={cx} cy={cy} r={4.1} fill="#3b82f6" stroke="#3b82f6" strokeWidth={2.5} />;
    }
    return <g />;
  };

  const GhostDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload?.projected) return <g />;
    return <circle cx={cx} cy={cy} r={5} fill="white" fillOpacity={0.7} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.8} />;
  };

  const RepCapActiveDot = (props) => {
    const { cx, cy, payload, index } = props;
    if (!payload?.projected) return <g />;
    const isRepCapDot = isBodyweight && payload.projVal === repCap;
    const isFirstRepCap = isRepCapDot && (index === 0 || (data[index - 1]?.projVal ?? 0) < repCap);
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#d4a017" stroke="#fff" strokeWidth={2} />
        {isFirstRepCap && (
          <text x={cx - 10} y={cy + 20} fontSize={9} fill="#B45309" fontWeight={600} textAnchor="end">
            <tspan x={cx - 10} dy="0">Studies recommend moving</tspan>
            <tspan x={cx - 10} dy="11">up in weight after {repCap} reps</tspan>
          </text>
        )}
      </g>
    );
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
        <div className="bg-amber-50 text-amber-700 border border-amber-300 px-3 py-1.5 rounded-md shadow-md text-xs font-semibold whitespace-nowrap">
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

  return (
    <div className={`rounded-xl overflow-hidden ${animDir === 'remove' ? 'new-seg-out' : 'new-seg-in'}`} style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)', padding: '12px 4px 8px' }}>
      {!hideLabel && (
        <p className="text-xs font-bold text-blue-500 uppercase tracking-wider text-center mb-2">
          {labelOverride || (isBodyweight ? 'Reps Progress' : 'Weight Progress (kg)')}
        </p>
      )}
      <div className="relative">
        {/* Sticky Y-axis overlay — stays fixed on the left while scrolling */}
        {animatedY && (
          <div
            className="absolute left-0 top-0 z-10 pointer-events-none"
            style={{ width: `${Y_AXIS_WIDTH}px`, height: `${chartHeight}px`, background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)' }}
          >
            <LineChart width={Y_AXIS_WIDTH} height={chartHeight} margin={{ top: CHART_MARGIN.top, right: 0, left: 0, bottom: CHART_MARGIN.bottom }}>
              <YAxis domain={yDomain} ticks={animatedY.ticks} interval={0} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={Y_AXIS_WIDTH} allowDataOverflow />
              <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: 'transparent' }} axisLine={false} tickLine={false} interval={0} />
            </LineChart>
          </div>
        )}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="overflow-x-auto overflow-y-hidden cursor-grab active:cursor-grabbing select-none"
          style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
          onMouseDown={(e) => handleDragStart(e.clientX)}
          onMouseMove={(e) => handleDragMove(e.clientX)}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <LineChart width={chartWidth} height={chartHeight} data={data} margin={CHART_MARGIN}>
            <YAxis domain={yDomain} hide allowDataOverflow />
            <XAxis dataKey="dateShort" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="valStatic" stroke="#3b82f6" strokeWidth={2} dot={<StaticDot />} activeDot={false} connectNulls={false} isAnimationActive={false} />
            <Line key={animKey} type="monotone" dataKey="valNew" stroke="#3b82f6" strokeWidth={2} dot={<NewDot />} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} connectNulls={true} isAnimationActive={true} animationDuration={600} animationEasing="ease-out" />
            <Line type="monotone" dataKey="projVal" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} dot={<GhostDot />} activeDot={<RepCapActiveDot />} connectNulls={true} isAnimationActive={false} />
            {goal && (() => {
              if (chartView === 'reps') {
                if (!goal.reps || goal.reps <= 0) return null;
                // Only show the reps goal line when the reps chart weight matches the goal weight
                if (goal.kg > 0 && repsChartWeight !== goal.kg) return null;
                return (
                  <ReferenceLine
                    y={goal.reps}
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    label={{ value: `🎯 ${goal.reps} reps`, position: 'insideTopRight', fontSize: 10, fill: '#22c55e', fontWeight: 700 }}
                  />
                );
              }
              if (!goal.kg || goal.kg <= 0) return null;
              return (
                <ReferenceLine
                  y={goal.kg}
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  label={{ value: `🎯 ${goal.kg} kg`, position: 'insideTopRight', fontSize: 10, fill: '#22c55e', fontWeight: 700 }}
                />
              );
            })()}
          </LineChart>
        </div>
      </div>
    </div>
  );
});

export default ProgressGraph;