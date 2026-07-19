const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const MUTED = 'rgba(255,255,255,0.85)';
const LABEL = '#C8C8C8';
const DIVIDER = 'rgba(255,255,255,0.15)';
const FONT = '"SF Pro Display", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Inter", sans-serif';
const SCALE = 2;
const W = 540;
const H = 960;

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

function formatDateHeader() {
  const d = new Date();
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
}

/**
 * Draws the workout summary as a transparent PNG overlay card.
 * mode: 'transparent' (card floats over any background, positioned at bottom)
 *       'card' (dark canvas background, card centered)
 */
export function drawWorkoutShareCard({ templateName, exercises, bestSets, prs, durationDisplay, dateStr, mode = 'transparent' }) {
  const isCard = mode === 'card';
  const prSet = new Set((prs || []).map(p => p.name));
  const exList = exercises || [];

  const cardPad = 28;
  const rowH = 27;
  let contentH = cardPad;
  contentH += 24; // title
  contentH += 8 + 16; // subtitle gap + subtitle
  contentH += 14 + 1 + 14; // divider
  contentH += exList.length * rowH;
  contentH += 24 + 58; // logo gap + logo
  contentH += cardPad;

  const cardW = 484;
  const cardH = contentH;
  const cardX = (W - cardW) / 2;
  const cardY = isCard ? Math.round((H - cardH) / 2) : H - cardH;
  const drawW = cardW - cardPad * 2;

  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext('2d');
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (isCard) {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a0a');
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Semi-transparent dark card background for readability on any story
  ctx.fillStyle = 'rgba(10, 10, 10, 0.68)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 24);
  ctx.fill();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const cx = cardX + cardPad;
  let y = cardY + cardPad;

  // --- Title: workout name ---
  ctx.font = `400 19px ${FONT}`;
  ctx.letterSpacing = '2px';
  ctx.fillStyle = WHITE;
  const fullTitle = (templateName || 'WORKOUT').toUpperCase();
  let title = fullTitle;
  while (ctx.measureText(title).width > drawW && title.length > 0) title = title.slice(0, -1);
  if (title !== fullTitle) title = title.slice(0, -2) + '…';
  ctx.fillText(title, cx, y);
  ctx.letterSpacing = '0px';
  y += 24;

  // --- Subtitle: date · duration · PRs ---
  y += 8;
  const dt = (dateStr || formatDateHeader()).toUpperCase();
  const prText = `${prs.length} PR${prs.length !== 1 ? 'S' : ''}`;
  ctx.font = `400 13px ${FONT}`;
  ctx.letterSpacing = '1.5px';
  ctx.fillStyle = LABEL;
  ctx.fillText(`${dt}  ·  ${durationDisplay}  ·  ${prText}`, cx, y);
  ctx.letterSpacing = '0px';
  y += 16;

  // --- Divider ---
  y += 14;
  ctx.strokeStyle = DIVIDER;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(cx + drawW, y);
  ctx.stroke();
  y += 1 + 14;

  // --- Exercise list ---
  exList.forEach((ex) => {
    const best = bestSets?.[ex.name];
    const isPR = prSet.has(ex.name);
    const rightText = best ? (best.kg ? `${Math.round(best.kg)}KG × ${best.reps}` : `${best.reps} REPS`) : '—';

    // Measure right text to know left max width
    ctx.font = `600 13px ${FONT}`;
    const rightW = ctx.measureText(rightText).width;

    // Left: sets × name (truncate if too long)
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = WHITE;
    const leftText = `${ex.sets || 1} × ${ex.name}`;
    const leftMaxW = drawW - rightW - 24;
    let displayLeft = leftText;
    while (ctx.measureText(displayLeft).width > leftMaxW && displayLeft.length > 0) displayLeft = displayLeft.slice(0, -1);
    if (displayLeft.length < leftText.length) displayLeft = displayLeft.slice(0, -2) + '…';
    ctx.fillText(displayLeft, cx, y);

    // PR badge
    if (isPR) {
      const leftW = ctx.measureText(displayLeft).width;
      const badgeX = cx + leftW + 7;
      const badgeW = 26;
      const badgeH = 15;
      ctx.fillStyle = GOLD;
      roundRect(ctx, badgeX, y, badgeW, badgeH, 4);
      ctx.fill();
      ctx.fillStyle = '#1a1a1a';
      ctx.font = `700 9px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PR', badgeX + badgeW / 2, y + badgeH / 2 + 0.5);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    }

    // Right: best set
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = best ? MUTED : LABEL;
    ctx.textAlign = 'right';
    ctx.fillText(rightText, cx + drawW, y);
    ctx.textAlign = 'left';

    y += rowH;
  });

  // --- LIFT logo ---
  const logoSize = 58;
  ctx.fillStyle = '#000000';
  const logoX = cx + drawW / 2 - logoSize / 2;
  const logoY = y + 24;
  roundRect(ctx, logoX, logoY, logoSize, logoSize, 15);
  ctx.fill();
  ctx.fillStyle = WHITE;
  ctx.font = `700 16px ${FONT}`;
  ctx.letterSpacing = '0.5px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LIFT.', logoX + logoSize / 2, logoY + logoSize / 2 + 1);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  return canvas;
}