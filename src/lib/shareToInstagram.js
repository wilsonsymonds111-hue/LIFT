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
  // JPEG instead of PNG — a 582KB PNG produces a ~776KB base64 URL that
  // exceeds iOS's URL scheme length limit, causing the deep link to silently
  // fail. JPEG at 0.85 quality is ~20KB, well within limits. The sticker has
  // a solid black background (matching the story background) so transparency
  // isn't needed.
  const stickerBase64 = stickerCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];

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
    const blob = await new Promise(resolve => stickerCanvas.toBlob(resolve, 'image/jpeg', 0.85));
    const file = new File([blob], 'lift-share.jpg', { type: 'image/jpeg' });

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
  link.href = stickerCanvas.toDataURL('image/jpeg', 0.85);
  link.download = 'lift-share.jpg';
  link.click();
  return { shared: false, fallback: 'download' };
}