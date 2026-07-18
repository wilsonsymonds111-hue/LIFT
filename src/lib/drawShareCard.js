const GOLD = '#D4C198';
const WHITE = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.7)';
const FAINT = 'rgba(255,255,255,0.55)';
const GRID = '#4A4A4A';
const DIVIDER = 'rgba(255,255,255,0.15)';
const DARK_BG = '#0a0a0a';
const CARD_BG = 'rgba(18,18,18,0.55)';
const BORDER = '#C84637';
const FONT = '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
const SCALE = 2;
const W = 540;
const H = 960;

function formatDateHeader() {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase();
}

function roundRect(ctx, x, y, w, h, r) {
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

function drawSpacedText(ctx, text, x, y, spacing) {
  let cx = x;
  ctx.textAlign = 'left';
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx;
}

function drawSpacedTextCentered(ctx, text, centerX, y, spacing) {
  ctx.textAlign = 'left';
  let totalW = 0;
  for (const ch of text) totalW += ctx.measureText(ch).width + spacing;
  totalW -= spacing;
  let cx = centerX - totalW / 2;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx;
}

function drawUpArrow(ctx, cx, topY, size, color) {
  ctx.fillStyle = color;
  const headH = size * 0.55;
  const shaftW = size * 0.32;
  const shaftH = size * 0.45;
  ctx.beginPath();
  ctx.moveTo(cx, topY);
  ctx.lineTo(cx + size / 2, topY + headH);
  ctx.lineTo(cx - size / 2, topY + headH);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(cx - shaftW / 2, topY + headH, shaftW, shaftH);
}

const toKg = (v) => typeof v === 'object' ? (v.kg || 0) : (v || 0);
const toReps = (v) => typeof v === 'object' ? (v.reps || 0) : (v || 0);

/**
 * Draws the share card as a self-contained overlay card.
 * mode: 'transparent' (card floats over any background, positioned in bottom third)
 *       'card' (dark canvas background, card centered — for text message sharing)
 */
export function drawShareCard({ exerciseName, weight, reps, history, isPR, sessionResults, mode = 'transparent' }) {
  const isCard = mode === 'card';
  const isBodyweight = !weight || weight === 0;
  const sets = (sessionResults && sessionResults.length > 0)
    ? sessionResults
    : (weight || reps ? [{ kg: weight, reps }] : []);

  // Delta from previous PR
  let delta = null;
  if (isPR && history && history.length > 0) {
    if (isBodyweight) {
      const prevMaxReps = Math.max(...history.map(toReps));
      if (reps > prevMaxReps) delta = { value: reps - prevMaxReps, unit: 'reps' };
    } else {
      const prevMaxKg = Math.max(...history.map(toKg));
      if (weight > prevMaxKg) delta = { value: weight - prevMaxKg, unit: 'kg' };
    }
  }

  // Build chart data
  let chartData = null;
  if (history && history.length > 0) {
    let allPoints = history.map(h => {
      const entry = typeof h === 'object' ? h : { kg: h, reps: 8 };
      return { val: isBodyweight ? toReps(entry) : toKg(entry), date: entry.date || '' };
    });
    if (sets.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      sets.forEach(s => allPoints.push({ val: isBodyweight ? toReps(s) : toKg(s), date: today }));
    }
    if (allPoints.length > 20) allPoints = allPoints.slice(-20);

    if (allPoints.length >= 1) {
      const vals = allPoints.map(p => p.val);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = (max - min) || 1;
      const chartH = 120;
      const chartPad = 14;
      chartData = {
        points: allPoints,
        min, max, range,
        chartH, chartPad,
        singlePoint: allPoints.length === 1,
        startVal: Math.round(allPoints[0].val),
        endVal: Math.round(allPoints[allPoints.length - 1].val),
        startDate: formatDateShort(allPoints[0].date),
        endDate: formatDateShort(allPoints[allPoints.length - 1].date),
      };
    }
  }

  // --- Calculate content height for dynamic card sizing ---
  const cardPad = 28;
  let contentH = cardPad; // top padding
  contentH += 30 + 16; // logo square + gap
  contentH += 26; // title
  contentH += 12; // gap before weight
  contentH += 76; // weight (68px) + reps inline
  if (delta) contentH += 8 + 18; // gap + delta
  contentH += 14 + 1 + 14; // gap + divider + gap
  if (chartData) contentH += 20 + chartData.chartH + 24; // chart header + chart + axis labels
  contentH += cardPad; // bottom padding

  const cardW = 484;
  const cardH = contentH;
  const cardX = (W - cardW) / 2;
  const cardY = isCard ? Math.round((H - cardH) / 2) : H - cardH - 40;
  const drawW = cardW - cardPad * 2;

  // --- Create canvas ---
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Card mode: dark canvas background
  if (isCard) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a0a');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // --- Semi-transparent dark card with soft glow (overlay quality) ---
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = CARD_BG;
  roundRect(ctx, cardX, cardY, cardW, cardH, 22);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  // Subtle gold-tinted border for a glowy edge
  ctx.strokeStyle = 'rgba(212,193,152,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const cx = cardX + cardPad;
  let y = cardY + cardPad;

  // --- Header: LIFT. logo in black rounded square ---
  const logoSize = 30;
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#000000';
  roundRect(ctx, cx, y, logoSize, logoSize, 8);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = `700 14px ${FONT}`;
  ctx.letterSpacing = '0.5px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LIFT.', cx + logoSize / 2, y + logoSize / 2 + 1);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  y += logoSize + 16;

  // --- Title: exercise name + PR suffix ---
  ctx.font = `400 18px ${FONT}`;
  ctx.letterSpacing = '2px';
  ctx.fillStyle = WHITE;
  const fullTitle = (exerciseName + (isPR ? ' PR' : '')).toUpperCase();
  let titleText = fullTitle;
  while (ctx.measureText(titleText).width > drawW && titleText.length > 0) {
    titleText = titleText.slice(0, -1);
  }
  if (titleText !== fullTitle) titleText = titleText.slice(0, -2) + '…';
  ctx.fillText(titleText, cx, y);
  ctx.letterSpacing = '0px';
  y += 26;

  // --- Main stat: weight (large) + reps (inline right) ---
  y += 12;
  const weightText = isBodyweight ? `${reps}` : `${Math.round(weight)}KG`;
  ctx.font = `700 68px ${FONT}`;
  ctx.letterSpacing = '-2px';
  ctx.fillStyle = WHITE;
  ctx.fillText(weightText, cx, y);
  const weightW = ctx.measureText(weightText).width;
  ctx.letterSpacing = '0px';

  ctx.font = `400 26px ${FONT}`;
  ctx.letterSpacing = '1px';
  ctx.fillStyle = WHITE;
  const repsLabel = isBodyweight ? 'REPS' : `× ${reps} REPS`;
  ctx.fillText(repsLabel, cx + weightW + 14, y + 40);
  ctx.letterSpacing = '0px';
  y += 76;

  // --- Delta from last PR ---
  if (delta) {
    y += 8;
    const deltaVal = delta.value % 1 === 0 ? delta.value.toString() : delta.value.toFixed(1);
    const deltaText = `+${deltaVal}${delta.unit.toUpperCase()} FROM LAST PR`;
    const dArrowSize = 10;
    ctx.shadowBlur = 0;
    drawUpArrow(ctx, cx + dArrowSize / 2, y + 3, dArrowSize, WHITE);
    ctx.shadowBlur = 4;
    ctx.font = `400 13px ${FONT}`;
    ctx.letterSpacing = '1.5px';
    ctx.fillStyle = WHITE;
    ctx.fillText(deltaText, cx + dArrowSize + 7, y + 3);
    ctx.letterSpacing = '0px';
    y += 18;
  }

  // --- Divider ---
  y += 14;
  ctx.shadowBlur = 0;
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(cx + drawW, y);
  ctx.stroke();
  y += 1 + 14;

  // --- Progress chart ---
  if (chartData) {
    const { points, min, max, range, chartH, chartPad, singlePoint, startVal, endVal, startDate, endDate } = chartData;

    // Chart section header
    ctx.shadowBlur = 4;
    ctx.font = `400 14px ${FONT}`;
    ctx.letterSpacing = '2px';
    ctx.fillStyle = GOLD;
    ctx.fillText('PROGRESS OVER TIME', cx, y);
    ctx.letterSpacing = '0px';
    y += 20;

    // Left padding for weight interval labels
    const labelW = 38;
    const chartX = cx + labelW;
    const chartDrawW = drawW - labelW;

    // Calculate coords for chart area
    const coords = points.map((p, i) => ({
      x: singlePoint ? chartDrawW / 2 : (i / (points.length - 1)) * chartDrawW,
      y: chartH - chartPad - ((p.val - min) / range) * (chartH - chartPad * 2),
    }));

    // Grid — horizontal lines
    ctx.shadowBlur = 0;
    for (let g = 1; g < 3; g++) {
      const gy = y + (chartH / 3) * g;
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartX, gy);
      ctx.lineTo(chartX + chartDrawW, gy);
      ctx.stroke();
    }
    // Grid — vertical lines
    for (let g = 1; g < 4; g++) {
      const gx = chartX + (chartDrawW / 4) * g;
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, y);
      ctx.lineTo(gx, y + chartH);
      ctx.stroke();
    }

    if (!singlePoint) {
      // Area fill under line
      ctx.beginPath();
      coords.forEach((c, i) => {
        if (i === 0) ctx.moveTo(chartX + c.x, y + c.y);
        else ctx.lineTo(chartX + c.x, y + c.y);
      });
      ctx.lineTo(chartX + coords[coords.length - 1].x, y + chartH);
      ctx.lineTo(chartX + coords[0].x, y + chartH);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, y, 0, y + chartH);
      areaGrad.addColorStop(0, 'rgba(212,193,152,0.25)');
      areaGrad.addColorStop(1, 'rgba(212,193,152,0)');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Line
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(212,193,152,0.45)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      coords.forEach((c, i) => {
        if (i === 0) ctx.moveTo(chartX + c.x, y + c.y);
        else ctx.lineTo(chartX + c.x, y + c.y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Single point — dashed reference line
      ctx.strokeStyle = 'rgba(212,193,152,0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(chartX, y + coords[0].y);
      ctx.lineTo(chartX + chartDrawW, y + coords[0].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Dots
    coords.forEach((c, i) => {
      const isLast = i === coords.length - 1;
      if (isLast) {
        ctx.fillStyle = GOLD;
        ctx.beginPath();
        ctx.arc(chartX + c.x, y + c.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = WHITE;
        ctx.beginPath();
        ctx.arc(chartX + c.x, y + c.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(chartX + c.x, y + c.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Weight interval labels on the left side
    ctx.shadowBlur = 6;
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'right';
    const unit = isBodyweight ? '' : 'kg';
    const maxLabel = Math.round(max);
    const minLabel = Math.round(min);
    const midLabel = Math.round((max + min) / 2);
    ctx.fillText(`${maxLabel}${unit}`, chartX - 8, y + 5);
    ctx.fillText(`${midLabel}${unit}`, chartX - 8, y + chartH / 2 + 5);
    ctx.fillText(`${minLabel}${unit}`, chartX - 8, y + chartH - 3);
    ctx.textAlign = 'left';

    y += chartH;

    // Combined axis labels: "60KG JUN 2025" left, "70KG JUL 2026" right
    ctx.shadowBlur = 4;
    ctx.font = `400 13px ${FONT}`;
    ctx.letterSpacing = '1px';
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'left';
    ctx.fillText(`${startVal}${isBodyweight ? '' : 'kg'} ${startDate}`, chartX, y + 8);
    if (!singlePoint) {
      ctx.textAlign = 'right';
      ctx.fillText(`${endVal}${isBodyweight ? '' : 'kg'} ${endDate}`, chartX + chartDrawW, y + 8);
    }
    ctx.letterSpacing = '0px';
    ctx.textAlign = 'left';
  }

  return canvas;
}