import { base44 } from '@/api/base44Client';

// In-memory cache with TTL
const cache = {};
const DEFAULT_TTL = 5 * 60 * 1000;
const LS_IMAGE_KEY = 'lift_exercise_images';

function now() { return Date.now(); }

/** Returns {name: image_url} from localStorage instantly — no API call. */
export function getCachedExerciseImages() {
  try {
    const raw = localStorage.getItem(LS_IMAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveImageMapToLocalStorage(details) {
  try {
    const map = {};
    (details || []).forEach(d => {
      if (d.image_url) map[d.name] = d.image_url;
    });
    localStorage.setItem(LS_IMAGE_KEY, JSON.stringify(map));
  } catch {}
}

export async function getExerciseList() {
  const key = 'Exercise_list';
  const entry = cache[key];
  if (entry && (now() - entry.time) < DEFAULT_TTL) return entry.data;

  const data = await base44.entities.Exercise.list('name', 200);
  cache[key] = { data, time: now() };
  return data;
}

export async function getExerciseDetailList() {
  const key = 'ExerciseDetail_list';
  const entry = cache[key];
  if (entry && (now() - entry.time) < DEFAULT_TTL) {
    // Ensure localStorage is populated even on cache hit
    if (!localStorage.getItem(LS_IMAGE_KEY)) saveImageMapToLocalStorage(entry.data);
    return entry.data;
  }

  const data = await base44.entities.ExerciseDetail.list('name', 500);
  cache[key] = { data, time: now() };
  saveImageMapToLocalStorage(data);
  return data;
}

/**
 * Returns {name: image_url} immediately from localStorage cache,
 * then refreshes from the API in the background (updates localStorage).
 * Use this for image display — avoids blocking on full ExerciseDetail fetch.
 */
export function getExerciseImageMap() {
  // Kick off background refresh (non-blocking)
  getExerciseDetailList().catch(() => {});
  // Return cached data instantly
  return getCachedExerciseImages();
}

export function invalidateExerciseCache() {
  delete cache['Exercise_list'];
  delete cache['ExerciseDetail_list'];
  try { localStorage.removeItem(LS_IMAGE_KEY); } catch {}
}