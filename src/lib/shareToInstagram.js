import { drawShareCard } from './drawShareCard';

/**
 * Shares workout stats to Instagram Stories.
 *
 * 1. Try the instagram-stories:// deep link (works in Safari, NOT in PWA mode).
 * 2. Fallback: Web Share API with the image as a file — shows the iOS share
 *    sheet where Instagram appears as an option.
 * 3. Last resort: download the image.
 */
export async function shareToInstagram(shareData) {
  const stickerCanvas = drawShareCard(shareData);
  // JPEG — small enough for iOS URL scheme limits. Solid black background
  // means no transparency is needed.
  const blob = await new Promise(resolve => stickerCanvas.toBlob(resolve, 'image/jpeg', 0.85));

  // Detect PWA/standalone mode — custom URL schemes are blocked by Apple
  // in WKWebView (the engine behind home-screen PWAs). Skip the deep link
  // entirely and go straight to the Web Share API.
  const isStandalone =
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  // --- Attempt 1: Instagram deep link (Safari only) ---
  if (!isStandalone) {
    const stickerBase64 = stickerCanvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    const deepLink = `instagram-stories://share?background_top_color=%23000000&background_bottom_color=%23000000&sticker_image=${encodeURIComponent(stickerBase64)}`;

    // Anchor-tag click is more reliable than window.location.href on iOS.
    const a = document.createElement('a');
    a.href = deepLink;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    let didHide = false;
    const onVis = () => { if (document.hidden) didHide = true; };
    document.addEventListener('visibilitychange', onVis);
    await new Promise(r => setTimeout(r, 600));
    document.removeEventListener('visibilitychange', onVis);

    if (didHide) return { shared: true, method: 'instagram-deep-link' };
  }

  // --- Attempt 2: Web Share API (shows share sheet with Instagram option) ---
  if (navigator.share) {
    const file = new File([blob], 'lift-share.jpg', { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
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