import html2canvas from 'html2canvas';

/**
 * Captures a DOM element as a transparent PNG canvas (the sticker).
 * Resizes to keep the base64 output under Instagram's limits.
 */
async function captureElementAsSticker(element) {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    logging: false,
    useCORS: true,
    allowTaint: true,
  });

  // Cap sticker width to keep base64 compact
  const maxStickerWidth = 680;
  if (canvas.width > maxStickerWidth) {
    const scale = maxStickerWidth / canvas.width;
    const resized = document.createElement('canvas');
    resized.width = Math.round(canvas.width * scale);
    resized.height = Math.round(canvas.height * scale);
    const ctx = resized.getContext('2d');
    ctx.drawImage(canvas, 0, 0, resized.width, resized.height);
    return resized;
  }

  return canvas;
}

/**
 * Generates a dark, aesthetic gradient background for Instagram Stories (1080×1920).
 */
function generateDefaultBackground() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // Base gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#121220');
  gradient.addColorStop(1, '#080808');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle warm radial glow in center
  const radial = ctx.createRadialGradient(540, 800, 0, 540, 800, 700);
  radial.addColorStop(0, 'rgba(234, 215, 150, 0.07)');
  radial.addColorStop(1, 'rgba(234, 215, 150, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, 1080, 1920);

  return canvas;
}

/**
 * Composites the sticker canvas onto the center of the background canvas.
 */
function compositeStickerOnBackground(stickerCanvas, bgCanvas) {
  const ctx = bgCanvas.getContext('2d');
  const targetWidth = bgCanvas.width * 0.62;
  const scale = targetWidth / stickerCanvas.width;
  const targetHeight = stickerCanvas.height * scale;
  const x = (bgCanvas.width - targetWidth) / 2;
  const y = (bgCanvas.height - targetHeight) / 2;
  ctx.drawImage(stickerCanvas, x, y, targetWidth, targetHeight);
  return bgCanvas;
}

/**
 * Shares a template element to Instagram.
 *
 * Primary: Web Share API with files — opens the native iOS share sheet,
 *          which includes Instagram Stories. Most reliable on iPhone.
 * Fallback: Instagram Stories deep link (sticker + background).
 * Last resort: download the sticker image.
 */
export async function shareToInstagram(element) {
  const stickerCanvas = await captureElementAsSticker(element);

  // --- Primary: Web Share API with files (native iOS share sheet) ---
  if (navigator.share && navigator.canShare) {
    const bgCanvas = generateDefaultBackground();
    const composited = compositeStickerOnBackground(stickerCanvas, bgCanvas);

    const blob = await new Promise(resolve => composited.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'lift-share.png', { type: 'image/png' });

    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'LIFT',
        });
        return { shared: true, method: 'web-share' };
      } catch (e) {
        // User cancelled — don't fall through to other methods
        if (e.name === 'AbortError') return { shared: false, cancelled: true };
      }
    }
  }

  // --- Fallback: Instagram Stories deep link ---
  try {
    const bgCanvas = generateDefaultBackground();
    const stickerBase64 = stickerCanvas.toDataURL('image/png').split(',')[1];
    const bgBase64 = bgCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    const url = `instagram-stories://share?source_image=${encodeURIComponent(bgBase64)}&sticker_image=${encodeURIComponent(stickerBase64)}`;

    let didHide = false;
    const onVisChange = () => { if (document.hidden) didHide = true; };
    document.addEventListener('visibilitychange', onVisChange);

    window.location.href = url;

    await new Promise(resolve => setTimeout(resolve, 1500));
    document.removeEventListener('visibilitychange', onVisChange);

    if (didHide) return { shared: true, method: 'deep-link' };
  } catch {}

  // --- Last resort: download the sticker image ---
  const link = document.createElement('a');
  link.href = stickerCanvas.toDataURL('image/png');
  link.download = 'lift-share.png';
  link.click();
  return { shared: false, fallback: 'download' };
}