import { drawShareCard } from './drawShareCard';

/**
 * Shares workout stats directly to Instagram Stories.
 *
 * Primary: instagram-stories:// deep link — opens Instagram with the sticker
 *          ready to post as a story.
 * Fallback: Web Share API with files — native iOS share sheet.
 * Last resort: download the image.
 */
export async function shareToInstagram(shareData) {
  const stickerCanvas = drawShareCard(shareData);
  const stickerBase64 = stickerCanvas.toDataURL('image/png').split(',')[1];

  const url = `instagram-stories://share?background_top_color=%23000000&background_bottom_color=%23000000&sticker_image=${encodeURIComponent(stickerBase64)}`;

  // Navigate BEFORE any await — iOS requires this within the user-gesture
  // call stack or the URL scheme is silently blocked.
  window.location.href = url;

  // Brief wait to detect if Instagram opened (page becomes hidden)
  let didHide = false;
  const onVisChange = () => { if (document.hidden) didHide = true; };
  document.addEventListener('visibilitychange', onVisChange);

  await new Promise(resolve => setTimeout(resolve, 600));
  document.removeEventListener('visibilitychange', onVisChange);

  if (didHide) return { shared: true, method: 'instagram-deep-link' };

  // --- Fallback: Web Share API with the sticker as a file ---
  if (navigator.share && navigator.canShare) {
    const blob = await new Promise(resolve => stickerCanvas.toBlob(resolve, 'image/png'));
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

  // --- Last resort: download ---
  const link = document.createElement('a');
  link.href = stickerCanvas.toDataURL('image/png');
  link.download = 'lift-share.png';
  link.click();
  return { shared: false, fallback: 'download' };
}