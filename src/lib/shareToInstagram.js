import { drawShareCard } from './drawShareCard';

/**
 * Generates a dark, aesthetic gradient background for Instagram Stories (1080×1920).
 */
function generateDefaultBackground() {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#121220');
  gradient.addColorStop(1, '#080808');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  const radial = ctx.createRadialGradient(540, 800, 0, 540, 800, 700);
  radial.addColorStop(0, 'rgba(234, 215, 150, 0.07)');
  radial.addColorStop(1, 'rgba(234, 215, 150, 0)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, 1080, 1920);

  return canvas;
}

/**
 * Shares workout stats directly to Instagram Stories.
 *
 * Primary: Instagram Stories deep link — opens Instagram app with the
 *          sticker + background ready to post as a story.
 * Fallback: Web Share API with files — native iOS share sheet.
 * Last resort: download the image.
 */
export async function shareToInstagram(shareData) {
  const stickerCanvas = drawShareCard(shareData);
  const bgCanvas = generateDefaultBackground();

  // --- Primary: Instagram Stories deep link ---
  try {
    const stickerBase64 = stickerCanvas.toDataURL('image/png').split(',')[1];
    const bgBase64 = bgCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    const url = `instagram-stories://share?source_image=${encodeURIComponent(bgBase64)}&sticker_image=${encodeURIComponent(stickerBase64)}`;

    let didHide = false;
    const onVisChange = () => { if (document.hidden) didHide = true; };
    document.addEventListener('visibilitychange', onVisChange);

    window.location.href = url;

    // Wait to see if Instagram opens
    await new Promise(resolve => setTimeout(resolve, 1500));
    document.removeEventListener('visibilitychange', onVisChange);

    if (didHide) return { shared: true, method: 'instagram-deep-link' };
  } catch {}

  // --- Fallback: Web Share API with files (native iOS share sheet) ---
  if (navigator.share && navigator.canShare) {
    // Composite sticker onto background
    const ctx = bgCanvas.getContext('2d');
    const targetWidth = bgCanvas.width * 0.62;
    const scale = targetWidth / stickerCanvas.width;
    const targetHeight = stickerCanvas.height * scale;
    const x = (bgCanvas.width - targetWidth) / 2;
    const y = (bgCanvas.height - targetHeight) / 2;
    ctx.drawImage(stickerCanvas, x, y, targetWidth, targetHeight);

    const blob = await new Promise(resolve => bgCanvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'lift-share.png', { type: 'image/png' });

    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'LIFT' });
        return { shared: true, method: 'web-share' };
      } catch (e) {
        if (e.name === 'AbortError') return { shared: false, cancelled: true };
      }
    }
  }

  // --- Last resort: download the sticker image ---
  const link = document.createElement('a');
  link.href = stickerCanvas.toDataURL('image/png');
  link.download = 'lift-share.png';
  link.click();
  return { shared: false, fallback: 'download' };
}