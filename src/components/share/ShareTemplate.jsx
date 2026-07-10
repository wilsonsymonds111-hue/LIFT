import { forwardRef, useMemo } from 'react';

const ACCENT = '#EAD796';
const WHITE = '#FFFFFF';

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
}

const LiftLogo = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 4v16" />
    <path d="M3 8l4-4 4 4" />
    <path d="M17 20V4" />
    <path d="M13 16l4 4 4-4" />
  </svg>
);

const ShareTemplate = forwardRef(function ShareTemplate({ exerciseName, weight, reps, bodyweight, ratio, history, isPR }, ref) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;
    const toKg = (h) => typeof h === 'object' ? (h.kg || 0) : (h || 0);

    const byDate = {};
    history.forEach(h => {
      const entry = typeof h === 'object' ? h : { kg: h, reps: 8 };
      const d = entry.date || '';
      if (!d) return;
      if (!byDate[d] || toKg(entry) > toKg(byDate[d])) byDate[d] = entry;
    });

    const dates = Object.keys(byDate).sort();
    if (dates.length < 2) return null;

    const points = dates.map(d => toKg(byDate[d]));
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const chartWidth = 280;
    const chartHeight = 48;
    const coords = points.map((p, i) => ({
      x: (i / (points.length - 1)) * chartWidth,
      y: chartHeight - ((p - min) / range) * chartHeight,
    }));

    // Limit to last 12 points for visual clarity
    const displayCoords = coords.length > 12 ? coords.slice(-12) : coords;
    if (displayCoords.length > 1) {
      const reScale = chartWidth / (displayCoords.length - 1);
      displayCoords.forEach((c, i) => { c.x = i * reScale; });
    }

    return {
      coords: displayCoords,
      chartWidth,
      chartHeight,
      startDate: formatDateShort(dates[0]),
      endDate: formatDateShort(dates[dates.length - 1]),
    };
  }, [history]);

  const isBodyweight = !weight || weight === 0;

  return (
    <div ref={ref} style={{
      width: 340,
      padding: '32px 28px',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      color: WHITE,
    }}>
      {/* LIFT Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
        <LiftLogo />
        <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '0.3em', color: ACCENT }}>LIFT</span>
      </div>

      {/* Exercise Name */}
      <div style={{
        fontSize: 12, fontWeight: 600, letterSpacing: '0.15em',
        textTransform: 'uppercase', opacity: 0.7, marginBottom: 6, textAlign: 'center',
      }}>
        {exerciseName}{isPR ? ' PR' : ''}
      </div>

      {/* Weight + Reps */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 28 }}>
        {!isBodyweight && (
          <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {weight}KG
          </span>
        )}
        {reps > 0 && (
          <span style={{ fontSize: isBodyweight ? 48 : 18, fontWeight: isBodyweight ? 800 : 400, letterSpacing: isBodyweight ? '-0.02em' : '0', opacity: isBodyweight ? 1 : 0.6 }}>
            {isBodyweight ? `${reps} REPS` : `× ${reps} REPS`}
          </span>
        )}
      </div>

      {/* Bodyweight Stats */}
      {bodyweight && bodyweight > 0 && !isBodyweight && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{bodyweight}KG</div>
            <div style={{ fontSize: 9, letterSpacing: '0.15em', opacity: 0.4, textTransform: 'uppercase', marginTop: 2 }}>Bodyweight</div>
          </div>
          {ratio && ratio > 0 && (
            <>
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.15)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{ratio.toFixed(2)}x</div>
                <div style={{ fontSize: 9, letterSpacing: '0.15em', opacity: 0.4, textTransform: 'uppercase', marginTop: 2 }}>Bodyweight</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Progress Chart */}
      {chartData && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.15em',
            textTransform: 'uppercase', opacity: 0.5, marginBottom: 10,
          }}>
            Progress Over Time
          </div>
          <svg width={chartData.chartWidth} height={chartData.chartHeight} style={{ overflow: 'visible' }}>
            <polyline
              points={chartData.coords.map(c => `${c.x},${c.y}`).join(' ')}
              fill="none"
              stroke={ACCENT}
              strokeWidth="1.5"
            />
            {chartData.coords.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r="2.5" fill={ACCENT} />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: chartData.chartWidth, marginTop: 6 }}>
            <span style={{ fontSize: 9, opacity: 0.4 }}>{chartData.startDate}</span>
            <span style={{ fontSize: 9, opacity: 0.4 }}>{chartData.endDate}</span>
          </div>
        </div>
      )}
    </div>
  );
});

export default ShareTemplate;