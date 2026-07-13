const BLUE = '#60a5fa';
const YELLOW = '#fcd34d';
const WHITE = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.8)';
const FAINT = 'rgba(255,255,255,0.65)';
const GRID = 'rgba(255,255,255,0.1)';
const DIVIDER = 'rgba(255,255,255,0.25)';
const DARK_BG = '#0a0a0a';
const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif';
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

function drawCoverImage(ctx, img, x, y, w, h) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let sx, sy, sw, sh;
  if (imgRatio > boxRatio) {
    sh = img.naturalHeight;
    sw = sh * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
    sy = 0;
  } else {
    sw = img.naturalWidth;
    sh = sw / boxRatio;
    sx = 0;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
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

export function drawShareCard({ exerciseName, weight, reps, history, isPR, sessionResults }) {
  const padX = 44;
  const contentW = W - padX * 2;

  const isBodyweight = !weight || weight === 0;
  const sets = (sessionResults && sessionResults.length > 0)
    ? sessionResults
    : (weight || reps ? [{ kg: weight, reps }] : []);

  // Calculate delta from previous PR
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
      const chartH = 130;
      const chartPad = 14;
      let coords;
      if (allPoints.length === 1) {
        coords = [{ x: contentW / 2, y: chartH - chartPad - (chartH - chartPad * 2) * 0.5 }];
      } else {
        coords = allPoints.map((p, i) => ({
          x: (i / (allPoints.length - 1)) * contentW,
          y: chartH - chartPad - ((p.val - min) / range) * (chartH - chartPad * 2),
        }));
      }
      chartData = {
        coords, chartW: contentW, chartH, singlePoint: allPoints.length === 1,
        startVal: Math.round(allPoints[0].val),
        endVal: Math.round(allPoints[allPoints.length - 1].val),
        startDate: formatDateShort(allPoints[0].date),
        endDate: formatDateShort(allPoints[allPoints.length - 1].date),
      };
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // --- Transparent background — PNG supports alpha, so the user can add
  // their own photo behind it in Instagram Stories or Messages ---
  ctx.shadowColor = 'rgba(0,0,0,0.85)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 1;

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  let y = 440;

  // --- Header: LIFT logo (left) + date (right) ---
  const arrowSize = 13;
  drawUpArrow(ctx, padX + arrowSize / 2, y + 2, arrowSize, WHITE);
  ctx.font = `800 17px ${FONT}`;
  ctx.fillStyle = WHITE;
  drawSpacedText(ctx, 'LIFT.', padX + arrowSize + 8, y + 1, 1.5);

  ctx.font = `600 12px ${FONT}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = 'right';
  ctx.fillText(formatDateHeader(), W - padX, y + 3);
  ctx.textAlign = 'left';

  y += 48;

  // --- Exercise name ---
  ctx.font = `700 24px ${FONT}`;
  ctx.fillStyle = WHITE;
  let nameText = exerciseName.toUpperCase();
  while (ctx.measureText(nameText).width > contentW && nameText.length > 0) {
    nameText = nameText.slice(0, -1);
  }
  if (nameText !== exerciseName.toUpperCase()) nameText = nameText.slice(0, -2) + '…';
  ctx.fillText(nameText, padX, y);
  y += 36;

  // --- PR badge ---
  if (isPR) {
    ctx.font = `800 11px ${FONT}`;
    const badgeText = 'NEW PR';
    const badgeW = ctx.measureText(badgeText).width + 20;
    ctx.fillStyle = YELLOW;
    roundRect(ctx, padX, y, badgeW, 22, 11);
    ctx.fill();
    ctx.fillStyle = DARK_BG;
    drawSpacedText(ctx, badgeText, padX + 10, y + 5, 1);
    y += 32;
  }

  // --- Primary stat ---
  const statText = isBodyweight ? `${reps}` : `${Math.round(weight)}KG`;
  ctx.font = `800 64px ${FONT}`;
  ctx.fillStyle = WHITE;
  ctx.fillText(statText, padX, y);
  const statW = ctx.measureText(statText).width;

  ctx.font = `500 22px ${FONT}`;
  ctx.fillStyle = WHITE;
  if (!isBodyweight && reps) {
    ctx.fillText(`× ${reps} REPS`, padX + statW + 14, y + 36);
  } else if (isBodyweight) {
    ctx.fillText('REPS', padX + statW + 14, y + 36);
  }
  y += 84;

  // --- Delta from last PR ---
  if (delta) {
    const deltaVal = delta.value % 1 === 0 ? delta.value.toString() : delta.value.toFixed(1);
    const deltaText = `+${deltaVal}${delta.unit.toUpperCase()} FROM LAST PR`;
    const dArrowSize = 10;
    drawUpArrow(ctx, padX + dArrowSize / 2, y + 3, dArrowSize, BLUE);
    ctx.font = `700 12px ${FONT}`;
    ctx.fillStyle = BLUE;
    drawSpacedText(ctx, deltaText, padX + dArrowSize + 7, y + 3, 0.8);
    y += 28;
  }

  // --- Divider ---
  y += 12;
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, y);
  ctx.lineTo(W - padX, y);
  ctx.stroke();
  y += 28;

  // --- Progress chart ---
  if (chartData) {
    const { coords, chartW, chartH, singlePoint, startVal, endVal, startDate, endDate } = chartData;

    ctx.font = `700 11px ${FONT}`;
    ctx.fillStyle = BLUE;
    drawSpacedText(ctx, 'PROGRESS OVER TIME', padX, y, 2);
    y += 26;

    // Grid lines
    for (let g = 1; g < 3; g++) {
      const gy = y + (chartH / 3) * g;
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, gy);
      ctx.lineTo(padX + chartW, gy);
      ctx.stroke();
    }

    if (!singlePoint) {
      // Area under line
      ctx.beginPath();
      coords.forEach((c, i) => {
        if (i === 0) ctx.moveTo(padX + c.x, y + c.y);
        else ctx.lineTo(padX + c.x, y + c.y);
      });
      ctx.lineTo(padX + coords[coords.length - 1].x, y + chartH);
      ctx.lineTo(padX + coords[0].x, y + chartH);
      ctx.closePath();
      const areaGrad = ctx.createLinearGradient(0, y, 0, y + chartH);
      areaGrad.addColorStop(0, 'rgba(96,165,250,0.25)');
      areaGrad.addColorStop(1, 'rgba(96,165,250,0)');
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = areaGrad;
      ctx.fill();
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;

      // Line
      ctx.strokeStyle = BLUE;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      coords.forEach((c, i) => {
        if (i === 0) ctx.moveTo(padX + c.x, y + c.y);
        else ctx.lineTo(padX + c.x, y + c.y);
      });
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(96,165,250,0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padX, y + coords[0].y);
      ctx.lineTo(padX + chartW, y + coords[0].y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Dots
    coords.forEach((c, i) => {
      const isLast = i === coords.length - 1;
      if (isLast) {
        ctx.fillStyle = BLUE;
        ctx.beginPath();
        ctx.arc(padX + c.x, y + c.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = DARK_BG;
        ctx.beginPath();
        ctx.arc(padX + c.x, y + c.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = DARK_BG;
        ctx.strokeStyle = BLUE;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(padX + c.x, y + c.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    });

    y += chartH;

    // Value labels
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'left';
    ctx.fillText(`${startVal}${isBodyweight ? '' : 'kg'}`, padX, y + 8);
    if (!singlePoint) {
      ctx.textAlign = 'right';
      ctx.fillText(`${endVal}${isBodyweight ? '' : 'kg'}`, W - padX, y + 8);
    }

    // Date labels
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = FAINT;
    ctx.textAlign = 'left';
    ctx.fillText(startDate, padX, y + 28);
    if (!singlePoint) {
      ctx.textAlign = 'right';
      ctx.fillText(endDate, W - padX, y + 28);
    }
    y += 56;
    ctx.textAlign = 'left';
  }

  // --- Today's sets (removed per user request) ---
  if (false && sets.length > 0) {
    ctx.strokeStyle = DIVIDER;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(W - padX, y);
    ctx.stroke();
    y += 24;

    ctx.font = `700 11px ${FONT}`;
    ctx.fillStyle = BLUE;
    drawSpacedText(ctx, "TODAY'S SETS", padX, y, 2);
    y += 28;

    const maxSets = 7;
    const visibleSets = sets.slice(0, maxSets);
    visibleSets.forEach((s, i) => {
      const setKg = toKg(s);
      const setReps = toReps(s);

      ctx.font = `600 15px ${FONT}`;
      ctx.fillStyle = FAINT;
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}`, padX, y + 2);

      ctx.font = `700 18px ${FONT}`;
      ctx.fillStyle = WHITE;
      ctx.fillText(isBodyweight ? 'BW' : `${setKg}kg`, padX + 36, y);

      ctx.font = `500 16px ${FONT}`;
      ctx.fillStyle = MUTED;
      ctx.fillText(`× ${setReps}`, padX + 130, y + 2);

      // Checkmark
      const checkX = W - padX - 12;
      const checkY = y + 10;
      ctx.fillStyle = BLUE;
      ctx.beginPath();
      ctx.arc(checkX, checkY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = DARK_BG;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(checkX - 4, checkY);
      ctx.lineTo(checkX - 1, checkY + 3);
      ctx.lineTo(checkX + 4, checkY - 3);
      ctx.stroke();

      y += 34;
    });

    if (sets.length > maxSets) {
      ctx.font = `500 13px ${FONT}`;
      ctx.fillStyle = FAINT;
      ctx.fillText(`+ ${sets.length - maxSets} more sets`, padX, y);
    }
  }

  return canvas;
}