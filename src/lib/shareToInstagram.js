import { drawShareCard } from './drawShareCard';

/** Downscale a canvas to a max width while preserving aspect ratio. */
function downscaleCanvas(canvas, maxWidth) {
  if (canvas.width <= maxWidth) return canvas;
  const scale = maxWidth / canvas.width;
  const resized = document.createElement('canvas');
  resized.width = Math.round(canvas.width * scale);
  resized.height = Math.round(canvas.height * scale);
  resized.getContext('2d').drawImage(canvas, 0, 0, resized.width, resized.height);
  return resized;
}

/**
 * Shares workout stats directly to Instagram Stories.
 *
 * Primary: instagram-stories:// deep link — opens Instagram with the sticker
 *          ready to post as a story.
 * Fallback: Web Share API with files — native iOS share sheet.
 * Last resort: download the image.
 */
export async function shareToInstagram(shareData) {
  // drawShareCard produces a 640px retina canvas — downscale to ~300px
  // to keep the base64 URL small enough for iOS URL schemes.
  const stickerCanvas = downscaleCanvas(drawShareCard(shareData), 300);
  const stickerBase64 = stickerCanvas.toDataURL('image/png').split(',')[1];

  const url = `instagram-stories://share?background_top_color=%231a1a2e&background_bottom_color=%23080808&sticker_image=${encodeURIComponent(stickerBase64)}`;

  // Navigate BEFORE any await — iOS requires this to be within the
  // user-gesture call stack or the URL scheme is silently blocked.
  window.location.href = url;

  // Wait to see if Instagram opens (page becomes hidden)
  let didHide = false;
  const onVisChange = () => { if (document.hidden) didHide = true; };
  document.addEventListener('visibilitychange', onVisChange);

  await new Promise(resolve => setTimeout(resolve, 2000));
  document.removeEventListener('visibilitychange', onVisChange);

  if (didHide) return { shared: true, method: 'instagram-deep-link' };

  // --- Fallback: Web Share API with files (native iOS share sheet) ---
  if (navigator.share && navigator.canShare) {
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 1080;
    bgCanvas.height = 1920;
    const ctx = bgCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#080808');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    const targetWidth = bgCanvas.width * 0.62;
    const scale = targetWidth / stickerCanvas.width;
    const targetHeight = stickerCanvas.height * scale;
    ctx.drawImage(stickerCanvas, (bgCanvas.width - targetWidth) / 2, (bgCanvas.height - targetHeight) / 2, targetWidth, targetHeight);

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

  // --- Last resort: download the image ---
  const link = document.createElement('a');
  link.href = stickerCanvas.toDataURL('image/png');
  link.download = 'lift-share.png';
  link.click();
  return { shared: false, fallback: 'download' };
}