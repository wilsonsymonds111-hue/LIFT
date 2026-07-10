import { getCachedExerciseImages } from './exerciseCache';

// Track which images have been preloaded to avoid duplicate work
const preloaded = new Set();
let preloadStarted = false;

/**
 * Preloads all exercise images into the browser cache using URLs from
 * localStorage. Called once on app startup — no API call needed since
 * the URLs are already cached. Images are fetched with low priority
 * via requestIdleCallback so they don't compete with critical renders.
 *
 * Once preloaded, the browser serves them instantly from its HTTP cache
 * when <img> tags request them on the Exercises page or Workout sheet.
 */
export function preloadExerciseImages() {
  if (preloadStarted) return;
  preloadStarted = true;

  const run = () => {
    const imageMap = getCachedExerciseImages();
    const urls = Object.values(imageMap).filter(Boolean);

    // Preload in small batches to avoid overwhelming the network
    const BATCH = 6;
    let idx = 0;

    const loadBatch = () => {
      if (idx >= urls.length) return;
      const batch = urls.slice(idx, idx + BATCH);
      idx += BATCH;

      batch.forEach(url => {
        if (preloaded.has(url)) return;
        preloaded.add(url);
        const img = new Image();
        img.decoding = 'async';
        img.src = url;
      });

      // Schedule next batch after current one has had time to download
      if (idx < urls.length) {
        setTimeout(loadBatch, 300);
      }
    };

    loadBatch();
  };

  // Defer until browser is idle so we don't block initial page render
  if (window.requestIdleCallback) {
    window.requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 1000);
  }
}