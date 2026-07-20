const GOLD = '#D4AF37';
const WHITE = '#FFFFFF';
const MUTED = '#A0A0A0';
const LABEL = '#A0A0A0';
const DIVIDER = '#444444';
const CARD_BG = 'rgba(20, 20, 20, 0.45)';
const CARD_BORDER = '#333333';
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

function formatTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
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
  const logoGap = 24;
  const logoH = 40;
  const logoW = 96;

  // Measure card content height
  let contentH = cardPad;
  contentH += 24; // title
  contentH += 8 + 16; // subtitle gap + subtitle
  contentH += 14 + 1 + 14; // divider
  contentH += exList.length * rowH;
  contentH += cardPad;

  const cardW = 484;
  const cardH = contentH;
  const cardX = (W - cardW) / 2;
  const logoYBelowCard = logoGap + logoH;
  // Total block height = card + gap + logo
  const totalBlockH = cardH + logoYBelowCard;
  // Position block so it sits near the bottom in transparent mode, centered in card mode
  const blockY = isCard ? Math.round((H - totalBlockH) / 2) : H - totalBlockH - 40;
  const cardY = blockY;
  const logoY = cardY + cardH + logoGap;
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

  // --- Card background ---
  ctx.fillStyle = CARD_BG;
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fill();

  // --- Card border ---
  ctx.strokeStyle = CARD_BORDER;
  ctx.lineWidth = 1;
  roundRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.stroke();

  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const cx = cardX + cardPad;
  let y = cardY + cardPad;

  // --- Title: workout name (bold, widely tracked) ---
  ctx.font = `700 19px ${FONT}`;
  ctx.letterSpacing = '2px';
  ctx.fillStyle = WHITE;
  const fullTitle = (templateName || 'WORKOUT').toUpperCase();
  let title = fullTitle;
  while (ctx.measureText(title).width > drawW && title.length > 0) title = title.slice(0, -1);
  if (title !== fullTitle) title = title.slice(0, -2) + '…';
  ctx.fillText(title, cx, y);
  ctx.letterSpacing = '0px';
  y += 24;

  // --- Subtitle: date · time · PRs ---
  y += 8;
  const dt = (dateStr || formatDateHeader()).toUpperCase();
  const tm = formatTime();
  const prText = `${prs.length} PR${prs.length !== 1 ? 'S' : ''}`;
  ctx.font = `400 13px ${FONT}`;
  ctx.letterSpacing = '1.5px';
  ctx.fillStyle = LABEL;
  ctx.fillText(`${dt}  ·  ${tm}  ·  ${prText}`, cx, y);
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

  // --- Exercise list (numbered rows) ---
  exList.forEach((ex, idx) => {
    const best = bestSets?.[ex.name];
    const isPR = prSet.has(ex.name);
    const rightText = best ? (best.kg ? `${Math.round(best.kg)}KG × ${best.reps}` : `${best.reps} REPS`) : '—';

    // Row number (bold, white)
    ctx.font = `700 14px ${FONT}`;
    ctx.fillStyle = WHITE;
    ctx.textAlign = 'left';
    const numText = `${idx + 1}`;
    ctx.fillText(numText, cx, y);
    const numW = ctx.measureText(numText).width;

    // "2 ×" set count
    const setCount = ex.sets || 1;
    const setStr = `${setCount} ×`;
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = MUTED;
    const setX = cx + 24; // fixed indent after number
    ctx.fillText(setStr, setX, y);
    const setW = ctx.measureText(setStr).width;

    // Right text width for truncation
    ctx.font = `600 13px ${FONT}`;
    const rightW = ctx.measureText(rightText).width;

    // Exercise name (truncate if too long)
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = WHITE;
    const nameX = setX + setW + 8;
    const leftMaxW = drawW - (nameX - cx) - rightW - 16;
    let displayName = ex.name || '';
    while (ctx.measureText(displayName).width > leftMaxW && displayName.length > 0) displayName = displayName.slice(0, -1);
    if (displayName.length < (ex.name || '').length) displayName = displayName.slice(0, -2) + '…';
    ctx.fillText(displayName, nameX, y);

    // Right side: PR badge + data (or em-dash)
    if (isPR && best) {
      // PR badge
      const dataText = rightText;
      ctx.font = `700 13px ${FONT}`;
      const dataW = ctx.measureText(dataText).width;
      const badgeW = 28;
      const badgeH = 16;
      const gap = 8;
      const rightEdge = cx + drawW;
      const badgeX = rightEdge - badgeW;
      const dataX = badgeX - gap - dataW;

      // Draw data text in gold
      ctx.font = `700 13px ${FONT}`;
      ctx.fillStyle = GOLD;
      ctx.textAlign = 'right';
      ctx.fillText(dataText, badgeX - gap, y);
      ctx.textAlign = 'left';

      // Badge
      ctx.fillStyle = GOLD;
      roundRect(ctx, badgeX, y, badgeW, badgeH, 4);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = `700 9px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PR', badgeX + badgeW / 2, y + badgeH / 2 + 0.5);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    } else {
      // Em-dash or data text on right
      ctx.font = `600 13px ${FONT}`;
      ctx.fillStyle = best ? MUTED : LABEL;
      ctx.textAlign = 'right';
      ctx.fillText(rightText, cx + drawW, y);
      ctx.textAlign = 'left';
    }

    y += rowH;
  });

  // --- LIFT logo: pill-shaped badge with white border, separate from card ---
  const logoX = cx + drawW / 2 - logoW / 2;
  ctx.fillStyle = 'rgba(20, 20, 20, 0.45)';
  ctx.strokeStyle = WHITE;
  ctx.lineWidth = 1;
  roundRect(ctx, logoX, logoY, logoW, logoH, logoH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = WHITE;
  ctx.font = `700 14px ${FONT}`;
  ctx.letterSpacing = '1px';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LIFT.', logoX + logoW / 2, logoY + logoH / 2 + 1);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  return canvas;
}