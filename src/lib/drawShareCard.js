const BLUE = '#3b82f6';
const WHITE = '#FFFFFF';
const DARK = '#1f2937';
const GRAY = '#6b7280';
const LIGHT_GRAY = '#9ca3af';
const BG_GRAY = '#f3f4f6';
const GREEN = '#22c55e';
const GOLD = '#d4a017';
const DIVIDER = '#e5e7eb';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('en-GB', { month: 'short' });
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

const toKg = (v) => typeof v === 'object' ? (v.kg || 0) : (v || 0);
const toReps = (v) => typeof v === 'object' ? (v.reps || 0) : (v || 0);

export function drawShareCard({ exerciseName, weight, reps, history, isPR, sessionResults, exerciseImage }) {
  const W = 400;
  const padX = 20;
  const padY = 20;
  const IMG_W = 92;
  const IMG_H = 68;
  const contentW = W - padX * 2;

  const isBodyweight = !weight || weight === 0;
  const sets = (sessionResults && sessionResults.length > 0)
    ? sessionResults
    : (weight || reps ? [{ kg: weight, reps }] : []);

  // Find best set index for PR star
  const bestSetIdx = sets.length > 0
    ? sets.reduce((bestIdx, s, i, arr) => {
        const currVal = isBodyweight ? toReps(s) : toKg(s);
        const bestVal = isBodyweight ? toReps(arr[bestIdx]) : toKg(arr[bestIdx]);
        return currVal > bestVal ? i : bestIdx;
      }, 0)
    : -1;

  // Process history for chart
  // Build chart data — show EVERY history point (matching the in-app graph),
  // not aggregated by date. This ensures multi-set sessions show as multiple
  // points instead of being collapsed into one.
  let chartData = null;
  if (history && history.length > 0) {
    // Every history entry is a point — same as ProgressGraph
    let allPoints = history.map(h => {
      const entry = typeof h === 'object' ? h : { kg: h, reps: 8 };
      return {
        val: isBodyweight ? toReps(entry) : toKg(entry),
        date: entry.date || '',
      };
    });
    // Append today's session results
    if (sets.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      sets.forEach(s => {
        allPoints.push({ val: isBodyweight ? toReps(s) : toKg(s), date: today });
      });
    }

    // Cap to most recent 20 points to keep the chart readable
    if (allPoints.length > 20) allPoints = allPoints.slice(-20);

    if (allPoints.length >= 1) {
      const vals = allPoints.map(p => p.val);
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = (max - min) || 1;
      const cw = contentW - 24;
      const ch = 76;
      const pad = 8;
      let coords;
      if (allPoints.length === 1) {
        coords = [{ x: cw / 2, y: ch - pad - (ch - pad * 2) * 0.5 }];
      } else {
        coords = allPoints.map((p, i) => ({
          x: (i / (allPoints.length - 1)) * cw,
          y: ch - pad - ((p.val - min) / range) * (ch - pad * 2),
        }));
      }
      // Date labels: first and last
      const firstDate = allPoints[0].date;
      const lastDate = allPoints[allPoints.length - 1].date;
      chartData = {
        coords, chartWidth: cw, chartHeight: ch, singlePoint: allPoints.length === 1,
        startVal: Math.round(allPoints[0].val),
        endVal: Math.round(allPoints[allPoints.length - 1].val),
        startDate: formatDateShort(firstDate),
        endDate: formatDateShort(lastDate),
      };
    }
  }

  // Calculate total height
  let h = padY;
  h += Math.max(IMG_H, 22 + (isPR ? 24 : 0)); // header
  h += 14; // gap
  if (chartData) {
    h += chartData.chartHeight + 44; // graph section
  }
  if (sets.length > 0) {
    h += 22 + sets.length * 28 + 6; // set header + rows
  }
  h += 14; // gap before logo
  h += 14; // logo
  h += padY;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // White rounded card background
  ctx.fillStyle = WHITE;
  roundRect(ctx, 0, 0, W, h, 16);
  ctx.fill();

  let y = padY;
  ctx.textBaseline = 'top';

  // --- Exercise name ---
  ctx.font = `700 17px ${FONT}`;
  ctx.fillStyle = BLUE;
  ctx.textAlign = 'left';
  let nameText = exerciseName;
  const maxNameW = contentW - IMG_W - 12;
  while (ctx.measureText(nameText).width > maxNameW && nameText.length > 0) {
    nameText = nameText.slice(0, -1);
  }
  if (nameText !== exerciseName) nameText = nameText.slice(0, -2) + '…';
  ctx.fillText(nameText, padX, y);

  // --- PR badge ---
  if (isPR) {
    const badgeY = y + 26;
    ctx.font = `700 10px ${FONT}`;
    const badgeText = 'NEW PR';
    const badgeW = ctx.measureText(badgeText).width + 16;
    ctx.fillStyle = '#fef3c7';
    roundRect(ctx, padX, badgeY, badgeW, 18, 9);
    ctx.fill();
    ctx.fillStyle = GOLD;
    ctx.fillText(badgeText, padX + 8, badgeY + 4);
  }

  // --- Exercise image (or placeholder) ---
  const imgX = W - padX - IMG_W;
  if (exerciseImage && exerciseImage.complete && exerciseImage.naturalWidth > 0) {
    ctx.save();
    roundRect(ctx, imgX, y, IMG_W, IMG_H, 12);
    ctx.clip();
    const imgRatio = exerciseImage.naturalWidth / exerciseImage.naturalHeight;
    const boxRatio = IMG_W / IMG_H;
    let sx, sy, sw, sh;
    if (imgRatio > boxRatio) {
      sh = exerciseImage.naturalHeight;
      sw = sh * boxRatio;
      sx = (exerciseImage.naturalWidth - sw) / 2;
      sy = 0;
    } else {
      sw = exerciseImage.naturalWidth;
      sh = sw / boxRatio;
      sx = 0;
      sy = (exerciseImage.naturalHeight - sh) / 2;
    }
    try {
      ctx.drawImage(exerciseImage, sx, sy, sw, sh, imgX, y, IMG_W, IMG_H);
    } catch (_) {
      drawPlaceholder(ctx, exerciseName, imgX, y, IMG_W, IMG_H);
    }
    ctx.restore();
  } else {
    drawPlaceholder(ctx, exerciseName, imgX, y, IMG_W, IMG_H);
  }

  y += Math.max(IMG_H, 22 + (isPR ? 24 : 0)) + 14;

  // --- Progress graph ---
  if (chartData) {
    const graphX = padX;
    const graphW = contentW;
    const graphH = chartData.chartHeight + 44;

    const grad = ctx.createLinearGradient(graphX, y, graphX + graphW, y);
    grad.addColorStop(0, '#eff6ff');
    grad.addColorStop(1, '#f5f3ff');
    ctx.fillStyle = grad;
    roundRect(ctx, graphX, y, graphW, graphH, 12);
    ctx.fill();

    ctx.font = `700 10px ${FONT}`;
    ctx.fillStyle = BLUE;
    drawSpacedText(ctx, isBodyweight ? 'REPS PROGRESS' : 'WEIGHT PROGRESS (KG)', graphX + 12, y + 10, 0.5);

    const lineX = graphX + 12;
    const lineY = y + 30;

    // Area under line (skip for single point — no line to fill under)
    if (!chartData.singlePoint) {
      ctx.beginPath();
      chartData.coords.forEach((c, i) => {
        if (i === 0) ctx.moveTo(lineX + c.x, lineY + c.y);
        else ctx.lineTo(lineX + c.x, lineY + c.y);
      });
      ctx.lineTo(lineX + chartData.coords[chartData.coords.length - 1].x, lineY + chartData.chartHeight);
      ctx.lineTo(lineX + chartData.coords[0].x, lineY + chartData.chartHeight);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, lineY, 0, lineY + chartData.chartHeight);
      areaGrad.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      areaGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Line
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      chartData.coords.forEach((c, i) => {
        if (i === 0) ctx.moveTo(lineX + c.x, lineY + c.y);
        else ctx.lineTo(lineX + c.x, lineY + c.y);
      });
      ctx.stroke();
    } else {
      // Single point — draw a dashed baseline at the value
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lineX, lineY + chartData.coords[0].y);
      ctx.lineTo(lineX + chartData.chartWidth, lineY + chartData.coords[0].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Dots
    chartData.coords.forEach((c, i) => {
      const isLast = i === chartData.coords.length - 1;
      ctx.fillStyle = WHITE;
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(lineX + c.x, lineY + c.y, isLast ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Labels
    ctx.font = `9px ${FONT}`;
    ctx.fillStyle = LIGHT_GRAY;
    ctx.textAlign = 'left';
    ctx.fillText(`${chartData.startVal}${isBodyweight ? '' : 'kg'}`, lineX, lineY + chartData.chartHeight + 6);
    if (!chartData.singlePoint) {
      ctx.textAlign = 'right';
      ctx.fillText(`${chartData.endVal}${isBodyweight ? '' : 'kg'}`, lineX + chartData.chartWidth, lineY + chartData.chartHeight + 6);
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText(chartData.startDate, lineX, lineY + chartData.chartHeight + 18);
    if (!chartData.singlePoint) {
      ctx.textAlign = 'right';
      ctx.fillText(chartData.endDate, lineX + chartData.chartWidth, lineY + chartData.chartHeight + 18);
    }

    y += graphH + 14;
    ctx.textAlign = 'left';
  }

  // --- Set rows ---
  if (sets.length > 0) {
    // Header
    ctx.font = `600 10px ${FONT}`;
    ctx.fillStyle = LIGHT_GRAY;
    ctx.textAlign = 'left';
    drawSpacedText(ctx, 'SET', padX, y, 0.5);
    drawSpacedText(ctx, 'WEIGHT', padX + 40, y, 0.5);
    drawSpacedText(ctx, 'REPS', padX + 140, y, 0.5);
    y += 20;

    // Divider
    ctx.strokeStyle = DIVIDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(W - padX, y);
    ctx.stroke();
    y += 8;

    sets.forEach((s, i) => {
      const setY = y + i * 28;
      const setKg = toKg(s);
      const setReps = toReps(s);
      const isBestSet = i === bestSetIdx && isPR;

      // Set number
      ctx.font = `600 13px ${FONT}`;
      ctx.fillStyle = GRAY;
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}`, padX, setY);

      // Weight
      ctx.font = `700 14px ${FONT}`;
      ctx.fillStyle = DARK;
      ctx.fillText(isBodyweight ? 'BW' : `${setKg}kg`, padX + 40, setY);

      // Reps
      ctx.font = `600 13px ${FONT}`;
      ctx.fillStyle = GRAY;
      ctx.fillText(`${setReps} reps`, padX + 140, setY);

      // PR star
      if (isBestSet) {
        const starX = W - padX - 38;
        const starY = setY + 6;
        drawStar(ctx, starX, starY, 7, GOLD);
      }

      // Checkmark
      const checkX = W - padX - 14;
      const checkY = setY + 7;
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(checkX, checkY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = WHITE;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(checkX - 3, checkY);
      ctx.lineTo(checkX - 1, checkY + 2.5);
      ctx.lineTo(checkX + 3, checkY - 2.5);
      ctx.stroke();
    });

    y += sets.length * 28 + 14;
    ctx.textAlign = 'left';
  }

  // --- LIFT logo ---
  ctx.font = `800 13px ${FONT}`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  const logoText = 'LIFT';
  const ls = 0.2 * 13;
  let totalW = 0;
  for (const ch of logoText) totalW += ctx.measureText(ch).width + ls;
  totalW -= ls;
  drawSpacedText(ctx, logoText, W / 2 - totalW / 2, y, ls);

  return canvas;
}

function drawPlaceholder(ctx, name, x, y, w, h) {
  ctx.fillStyle = BG_GRAY;
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.font = `800 26px ${FONT}`;
  ctx.fillStyle = LIGHT_GRAY;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((name || '?')[0], x + w / 2, y + h / 2);
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    const innerAngle = angle + Math.PI / 5;
    const ix = cx + Math.cos(innerAngle) * r * 0.45;
    const iy = cy + Math.sin(innerAngle) * r * 0.45;
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
}