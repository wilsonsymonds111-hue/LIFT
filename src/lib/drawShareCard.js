const ACCENT = '#EAD98A';
const WHITE = '#FFFFFF';
const DIVIDER = 'rgba(255,255,255,0.12)';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
}

/** Draws text with manual letter spacing (canvas lacks native support on older iOS). */
function drawSpacedText(ctx, text, x, y, spacing) {
  let cx = x;
  ctx.textAlign = 'left';
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx;
}

export function drawShareCard({ exerciseName, weight, reps, history, isPR }) {
  const W = 320;
  const padX = 24;
  const padY = 28;

  const isBodyweight = !weight || weight === 0;

  // Process history for chart
  let chartData = null;
  if (history && history.length > 0) {
    const toKg = h => typeof h === 'object' ? (h.kg || 0) : (h || 0);
    const byDate = {};
    history.forEach(h => {
      const entry = typeof h === 'object' ? h : { kg: h, reps: 8 };
      const d = entry.date || '';
      if (!d) return;
      if (!byDate[d] || toKg(entry) > toKg(byDate[d])) byDate[d] = entry;
    });
    const dates = Object.keys(byDate).sort();
    if (dates.length >= 2) {
      const points = dates.map(d => toKg(byDate[d]));
      const min = Math.min(...points);
      const max = Math.max(...points);
      const range = max - min || 1;
      const cw = 272, ch = 52, pad = 4;
      let coords = points.map((p, i) => ({
        x: (i / (points.length - 1)) * cw,
        y: ch - pad - ((p - min) / range) * (ch - pad * 2),
      }));
      if (coords.length > 12) coords = coords.slice(-12);
      if (coords.length > 1) {
        const rs = cw / (coords.length - 1);
        coords.forEach((c, i) => { c.x = i * rs; });
      }
      chartData = {
        coords, chartWidth: cw, chartHeight: ch,
        startWeight: Math.round(toKg(byDate[dates[0]])),
        endWeight: Math.round(toKg(byDate[dates[dates.length - 1]])),
        startDate: formatDateShort(dates[0]),
        endDate: formatDateShort(dates[dates.length - 1]),
      };
    }
  }

  // Calculate total height
  let h = padY;
  h += 18; // logo
  h += 22; // gap after logo
  h += 17; // exercise name line
  h += 6;  // gap
  h += 42; // weight/reps
  h += 22; // gap
  h += 1 + 18; // divider + gap
  if (chartData) {
    h += 9 + 10; // title + gap
    h += chartData.chartHeight + 6; // chart + gap
    h += 10; // date labels
    h += 1 + 18; // bottom divider
  }
  h += padY;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Solid black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, W, h);

  let y = padY;
  ctx.textBaseline = 'top';

  // LIFT logo — top-LEFT, arrow icon + spaced text
  const logoFontSize = 14;
  ctx.font = `700 ${logoFontSize}px ${FONT}`;
  ctx.fillStyle = ACCENT;
  const ls = 0.28 * logoFontSize;
  const arrowW = 18;
  const gap = 6;
  let logoX = padX;

  // Draw arrow (diagonal line + arrowhead)
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(logoX + 4, y + 12);
  ctx.lineTo(logoX + 14, y + 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(logoX + 7, y + 2);
  ctx.lineTo(logoX + 14, y + 2);
  ctx.lineTo(logoX + 14, y + 9);
  ctx.stroke();

  drawSpacedText(ctx, 'LIFT', logoX + arrowW + gap, y, ls);

  y += 18 + 22;

  // Exercise name (uppercase, letter-spaced) — left-aligned
  const nameFontSize = 13;
  ctx.font = `600 ${nameFontSize}px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const nameText = (exerciseName + (isPR ? ' PR' : '')).toUpperCase();
  drawSpacedText(ctx, nameText, padX, y, 0.1 * nameFontSize);

  y += 17 + 6;

  // Weight + Reps — left-aligned
  if (!isBodyweight) {
    ctx.font = `800 42px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'left';
    const weightText = `${weight}KG`;
    const wMetrics = ctx.measureText(weightText);
    ctx.fillText(weightText, padX, y);

    if (reps > 0) {
      ctx.font = `500 15px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(`× ${reps} REPS`, padX + wMetrics.width + 8, y + 27);
    }
  } else if (reps > 0) {
    ctx.font = `800 42px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'left';
    ctx.fillText(`${reps} REPS`, padX, y);
  }

  y += 42 + 22;

  // Divider
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(W - padX, y);
  ctx.stroke();
  y += 18;

  // Progress chart
  if (chartData) {
    // Chart title
    ctx.font = `600 9px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    drawSpacedText(ctx, 'PROGRESS OVER TIME', padX, y, 0.15 * 9);
    y += 9 + 10;

    const chartX = padX;

    // Polyline
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    chartData.coords.forEach((c, i) => {
      if (i === 0) ctx.moveTo(chartX + c.x, y + c.y);
      else ctx.lineTo(chartX + c.x, y + c.y);
    });
    ctx.stroke();

    // Dots
    chartData.coords.forEach(c => {
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.arc(chartX + c.x, y + c.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // Weight labels
    ctx.font = `8px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText(`${chartData.startWeight}KG`, chartX, y + chartData.chartHeight + 4);
    ctx.textAlign = 'right';
    ctx.fillText(`${chartData.endWeight}KG`, chartX + chartData.chartWidth, y - 12);

    y += chartData.chartHeight + 6;

    // Date labels
    ctx.font = `8px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText(chartData.startDate, chartX, y);
    ctx.textAlign = 'right';
    ctx.fillText(chartData.endDate, chartX + chartData.chartWidth, y);
    y += 10;

    // Bottom divider
    ctx.strokeStyle = DIVIDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(W - padX, y);
    ctx.stroke();
  }

  return canvas;
}