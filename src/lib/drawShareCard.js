const ACCENT = '#C5B378';
const WHITE = '#FFFFFF';
const DIVIDER = 'rgba(255,255,255,0.12)';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

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

function drawCenteredSpacedText(ctx, text, centerX, y, spacing) {
  let totalWidth = 0;
  for (const ch of text) totalWidth += ctx.measureText(ch).width + spacing;
  totalWidth -= spacing;
  drawSpacedText(ctx, text, centerX - totalWidth / 2, y, spacing);
}

export function drawShareCard({ exerciseName, weight, reps, bodyweight, ratio, history, isPR }) {
  const s = 2; // retina scale
  const W = 320 * s;
  const padX = 24 * s;
  const padY = 28 * s;

  const isBodyweight = !weight || weight === 0;
  const showBodyweight = bodyweight && bodyweight > 0 && !isBodyweight;

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
      const cw = 272 * s, ch = 52 * s, pad = 4 * s;
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
  h += 18 * s; // logo
  h += 22 * s; // gap after logo
  h += 17 * s; // exercise name line
  h += 6 * s;  // gap
  h += 42 * s; // weight/reps
  h += 22 * s; // gap
  h += 1 * s + 18 * s; // divider + gap
  if (showBodyweight) h += 44 * s; // bodyweight row
  if (chartData) {
    if (showBodyweight) h += 1 * s + 18 * s; // extra divider
    h += 9 * s + 10 * s; // title + gap
    h += chartData.chartHeight + 6 * s; // chart + gap
    h += 10 * s; // date labels
    h += 1 * s + 18 * s; // bottom divider
  }
  h += padY;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Background — rounded rect with semi-transparent dark fill
  ctx.fillStyle = 'rgba(10, 10, 10, 0.85)';
  drawRoundedRect(ctx, 0, 0, W, h, 20 * s);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1 * s;
  drawRoundedRect(ctx, 0, 0, W, h, 20 * s);
  ctx.stroke();

  let y = padY;
  ctx.textBaseline = 'top';

  // LIFT logo — arrow icon + spaced text
  const logoFontSize = 14 * s;
  ctx.font = `700 ${logoFontSize}px ${FONT}`;
  ctx.fillStyle = ACCENT;
  // Measure "LIFT" with letter spacing
  const ls = 0.28 * logoFontSize;
  let liftW = 0;
  for (const ch of 'LIFT') liftW += ctx.measureText(ch).width + ls;
  liftW -= ls;
  // Arrow icon width ~18px
  const arrowW = 18 * s;
  const gap = 6 * s;
  const totalLogoW = arrowW + gap + liftW;
  let logoX = W / 2 - totalLogoW / 2;

  // Draw arrow (diagonal line + arrowhead)
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 2.5 * s;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(logoX + 4 * s, y + 12 * s);
  ctx.lineTo(logoX + 14 * s, y + 2 * s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(logoX + 7 * s, y + 2 * s);
  ctx.lineTo(logoX + 14 * s, y + 2 * s);
  ctx.lineTo(logoX + 14 * s, y + 9 * s);
  ctx.stroke();

  drawSpacedText(ctx, 'LIFT', logoX + arrowW + gap, y, ls);

  y += 18 * s + 22 * s;

  // Exercise name (uppercase, letter-spaced)
  const nameFontSize = 13 * s;
  ctx.font = `600 ${nameFontSize}px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  const nameText = (exerciseName + (isPR ? ' PR' : '')).toUpperCase();
  drawCenteredSpacedText(ctx, nameText, W / 2, y, 0.1 * nameFontSize);

  y += 17 * s + 6 * s;

  // Weight + Reps
  if (!isBodyweight) {
    ctx.font = `800 ${42 * s}px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'left';
    const weightText = `${weight}KG`;
    const wMetrics = ctx.measureText(weightText);

    ctx.font = `500 ${15 * s}px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const repsText = reps > 0 ? `× ${reps} REPS` : '';
    const rMetrics = repsText ? ctx.measureText(repsText) : { width: 0 };
    const gap2 = 8 * s;
    const totalW = wMetrics.width + (repsText ? gap2 + rMetrics.width : 0);
    let wx = W / 2 - totalW / 2;

    ctx.font = `800 ${42 * s}px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.fillText(weightText, wx, y);
    wx += wMetrics.width + gap2;

    if (repsText) {
      ctx.font = `500 ${15 * s}px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText(repsText, wx, y + 27 * s);
    }
  } else if (reps > 0) {
    ctx.font = `800 ${42 * s}px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'center';
    ctx.fillText(`${reps} REPS`, W / 2, y);
  }

  y += 42 * s + 22 * s;

  // Divider
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(W - padX, y);
  ctx.stroke();
  y += 18 * s;

  // Bodyweight stats
  if (showBodyweight) {
    const bwText = `${bodyweight}KG`;
    ctx.font = `700 ${20 * s}px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'center';
    const bwW = ctx.measureText(bwText).width;

    let totalBwW = bwW;
    let ratioText = '';
    let ratioW = 0;
    if (ratio && ratio > 0) {
      ratioText = `${ratio.toFixed(2)}×`;
      ctx.font = `700 ${20 * s}px ${FONT}`;
      ratioW = ctx.measureText(ratioText).width;
      totalBwW += 28 * s + ratioW;
    }

    let bx = W / 2 - totalBwW / 2;
    ctx.font = `700 ${20 * s}px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.fillText(bwText, bx + bwW / 2, y);
    ctx.font = `600 ${8 * s}px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('BODYWEIGHT', bx + bwW / 2, y + 24 * s);
    bx += bwW;

    if (ratioText) {
      bx += 28 * s;
      ctx.strokeStyle = DIVIDER;
      ctx.beginPath();
      ctx.moveTo(bx - 14 * s, y + 2 * s);
      ctx.lineTo(bx - 14 * s, y + 28 * s);
      ctx.stroke();

      ctx.font = `700 ${20 * s}px ${FONT}`;
      ctx.fillStyle = WHITE;
      ctx.fillText(ratioText, bx + ratioW / 2, y);
      ctx.font = `600 ${8 * s}px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('RATIO', bx + ratioW / 2, y + 24 * s);
    }

    y += 44 * s;
  }

  // Progress chart
  if (chartData) {
    if (showBodyweight) {
      ctx.strokeStyle = DIVIDER;
      ctx.lineWidth = 1 * s;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(W - padX, y);
      ctx.stroke();
      y += 18 * s;
    }

    // Chart title
    ctx.font = `600 ${9 * s}px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    drawCenteredSpacedText(ctx, 'PROGRESS OVER TIME', W / 2, y, 0.15 * 9 * s);
    y += 9 * s + 10 * s;

    const chartX = (W - chartData.chartWidth) / 2;

    // Polyline
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 2 * s;
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
      ctx.arc(chartX + c.x, y + c.y, 3 * s, 0, Math.PI * 2);
      ctx.fill();
    });

    // Weight labels
    ctx.font = `${8 * s}px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText(`${chartData.startWeight}KG`, chartX, y + chartData.chartHeight - 8 * s);
    ctx.textAlign = 'right';
    ctx.fillText(`${chartData.endWeight}KG`, chartX + chartData.chartWidth, y - 4 * s);

    y += chartData.chartHeight + 6 * s;

    // Date labels
    ctx.font = `${8 * s}px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'left';
    ctx.fillText(chartData.startDate, chartX, y);
    ctx.textAlign = 'right';
    ctx.fillText(chartData.endDate, chartX + chartData.chartWidth, y);
    y += 10 * s;

    // Bottom divider
    ctx.strokeStyle = DIVIDER;
    ctx.lineWidth = 1 * s;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(W - padX, y);
    ctx.stroke();
  }

  return canvas;
}