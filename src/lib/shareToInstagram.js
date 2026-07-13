import { drawShareCard } from './drawShareCard';

/**
 * Shares workout stats to Instagram Stories as a full 9:16 portrait image.
 *
 * Primary: instagram-stories:// deep link — opens Instagram with the image
 *          ready to post as a story.
 * Fallback: Web Share API with files — native iOS share sheet.
 * Last resort: download the image.
 */
export async function shareToInstagram(shareData) {
  const stickerCanvas = drawShareCard(shareData);
  // JPEG keeps the base64 small enough for the deep-link URL
  const stickerBase64 = stickerCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];

  const url = `instagram-stories://share?background_top_color=%230a0a0a&background_bottom_color=%230a0a0a&sticker_image=${encodeURIComponent(stickerBase64)}`;

  const blobPromise = new Promise(resolve => stickerCanvas.toBlob(resolve, 'image/jpeg', 0.85));

  // Navigate BEFORE any await — iOS requires this within the user-gesture
  // call stack or the URL scheme is silently blocked.
  window.location.href = url;

  let didHide = false;
  const onVisChange = () => { if (document.hidden) didHide = true; };
  document.addEventListener('visibilitychange', onVisChange);

  await new Promise(resolve => setTimeout(resolve, 350));
  document.removeEventListener('visibilitychange', onVisChange);

  if (didHide) return { shared: true, method: 'instagram-deep-link' };

  // --- Fallback: Web Share API ---
  if (navigator.share && navigator.canShare) {
    const blob = await blobPromise;
    const file = new File([blob], 'lift-share.jpg', { type: 'image/jpeg' });

    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], ...(shareData.isPR ? { title: 'New PR' } : {}) });
        return { shared: true, method: 'web-share' };
      } catch (e) {
        if (e.name === 'AbortError') return { shared: false, cancelled: true };
      }
    }
  }

  // --- Last resort: download ---
  const link = document.createElement('a');
  link.href = stickerCanvas.toDataURL('image/jpeg', 0.85);
  link.download = 'lift-share.jpg';
  link.click();
  return { shared: false, fallback: 'download' };
}