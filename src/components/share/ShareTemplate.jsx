import { forwardRef, useMemo } from 'react';

const ACCENT = '#C5B378';
const WHITE = '#FFFFFF';
const DIVIDER = 'rgba(255,255,255,0.12)';

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
}

const LiftLogo = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="9 7 17 7 17 15" />
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

    const chartWidth = 272;
    const chartHeight = 52;
    const pad = 4;
    const coords = points.map((p, i) => ({
      x: (i / (points.length - 1)) * chartWidth,
      y: chartHeight - pad - ((p - min) / range) * (chartHeight - pad * 2),
    }));

    const displayCoords = coords.length > 12 ? coords.slice(-12) : coords;
    if (displayCoords.length > 1) {
      const reScale = chartWidth / (displayCoords.length - 1);
      displayCoords.forEach((c, i) => { c.x = i * reScale; });
    }

    return {
      coords: displayCoords,
      chartWidth,
      chartHeight,
      startWeight: Math.round(toKg(byDate[dates[0]])),
      endWeight: Math.round(toKg(byDate[dates[dates.length - 1]])),
      startDate: formatDateShort(dates[0]),
      endDate: formatDateShort(dates[dates.length - 1]),
    };
  }, [history]);

  const isBodyweight = !weight || weight === 0;
  const showBodyweight = bodyweight && bodyweight > 0 && !isBodyweight;

  return (
    <div ref={ref} style={{
      width: 320,
      padding: '28px 24px',
      background: 'rgba(10, 10, 10, 0.58)',
      borderRadius: 20,
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
      color: WHITE,
    }}>
      {/* LIFT Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 22 }}>
        <LiftLogo />
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.28em', color: ACCENT }}>LIFT</span>
      </div>

      {/* Exercise Name */}
      <div style={{
        fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', opacity: 0.85, marginBottom: 6, textAlign: 'center',
      }}>
        {exerciseName}{isPR ? ' PR' : ''}
      </div>

      {/* Weight + Reps */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 22 }}>
        {!isBodyweight && (
          <span style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {weight}KG
          </span>
        )}
        {reps > 0 && (
          <span style={{
            fontSize: isBodyweight ? 42 : 15,
            fontWeight: isBodyweight ? 800 : 500,
            letterSpacing: isBodyweight ? '-0.02em' : '0',
            opacity: isBodyweight ? 1 : 0.55,
          }}>
            {isBodyweight ? `${reps} REPS` : `× ${reps} REPS`}
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: 1, background: DIVIDER, marginBottom: 18 }} />

      {/* Bodyweight Stats */}
      {showBodyweight && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 18 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{bodyweight}KG</div>
            <div style={{ fontSize: 8, letterSpacing: '0.15em', opacity: 0.4, textTransform: 'uppercase', marginTop: 2 }}>Bodyweight</div>
          </div>
          {ratio && ratio > 0 && (
            <>
              <div style={{ width: 1, height: 26, background: DIVIDER }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{ratio.toFixed(2)}×</div>
                <div style={{ fontSize: 8, letterSpacing: '0.15em', opacity: 0.4, textTransform: 'uppercase', marginTop: 2 }}>Bodyweight</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Progress Chart */}
      {chartData && (
        <>
          {(showBodyweight) && <div style={{ width: '100%', height: 1, background: DIVIDER, marginBottom: 18 }} />}
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.15em',
              textTransform: 'uppercase', opacity: 0.5, marginBottom: 10,
            }}>
              Progress Over Time
            </div>
            <div style={{ position: 'relative', width: chartData.chartWidth, height: chartData.chartHeight }}>
              <svg width={chartData.chartWidth} height={chartData.chartHeight} style={{ overflow: 'visible' }}>
                <polyline
                  points={chartData.coords.map(c => `${c.x},${c.y}`).join(' ')}
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {chartData.coords.map((c, i) => (
                  <circle key={i} cx={c.x} cy={c.y} r="3" fill={ACCENT} />
                ))}
              </svg>
              {/* Y-axis weight labels — positioned near first/last data points */}
              <span style={{
                position: 'absolute', left: 0,
                top: chartData.coords[0].y,
                transform: 'translateY(10px)',
                fontSize: 8, opacity: 0.4,
              }}>
                {chartData.startWeight}KG
              </span>
              <span style={{
                position: 'absolute', right: 0,
                top: chartData.coords[chartData.coords.length - 1].y,
                transform: 'translateY(-14px)',
                fontSize: 8, opacity: 0.4,
              }}>
                {chartData.endWeight}KG
              </span>
            </div>
            {/* X-axis date labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: chartData.chartWidth, marginTop: 6 }}>
              <span style={{ fontSize: 8, opacity: 0.4 }}>{chartData.startDate}</span>
              <span style={{ fontSize: 8, opacity: 0.4 }}>{chartData.endDate}</span>
            </div>
          </div>
          <div style={{ width: '100%', height: 1, background: DIVIDER, marginTop: 18 }} />
        </>
      )}
    </div>
  );
});

export default ShareTemplate;