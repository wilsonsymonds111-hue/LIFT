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
 * Shares a template element to Instagram Stories via deep link.
 * The template becomes a draggable/resizable sticker over a default background.
 *
 * Falls back to downloading the sticker image if Instagram isn't installed.
 */
export async function shareToInstagram(element) {
  const stickerCanvas = await captureElementAsSticker(element);
  const bgCanvas = generateDefaultBackground();

  const stickerBase64 = stickerCanvas.toDataURL('image/png').split(',')[1];
  const bgBase64 = bgCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];

  const url = `instagram-stories://share?source_image=${encodeURIComponent(bgBase64)}&sticker_image=${encodeURIComponent(stickerBase64)}`;

  // Track whether the app was hidden (= Instagram opened)
  let didHide = false;
  const onVisChange = () => { if (document.hidden) didHide = true; };
  document.addEventListener('visibilitychange', onVisChange);

  window.location.href = url;

  // If still visible after 1.5s, Instagram didn't open — download as fallback
  return new Promise(resolve => {
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onVisChange);
      if (!didHide) {
        const link = document.createElement('a');
        link.href = stickerCanvas.toDataURL('image/png');
        link.download = 'lift-pr-share.png';
        link.click();
        resolve({ shared: false, fallback: 'download' });
      } else {
        resolve({ shared: true });
      }
    }, 1500);
  });
}