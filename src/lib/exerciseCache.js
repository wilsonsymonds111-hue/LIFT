import { base44 } from '@/api/base44Client';

// Simple in-memory cache with TTL to avoid redundant API calls
const cache = {};
const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes — balances freshness with performance

// localStorage-backed image map — survives page reloads so workout images
// appear instantly on repeat opens while the API refreshes in the background.
const LS_KEY = 'exerciseImageMap';
const LS_TTL = 30 * 60 * 1000; // 30 minutes — images rarely change; instant loads on repeat opens

function now() { return Date.now(); }

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
  if (entry && (now() - entry.time) < DEFAULT_TTL) return entry.data;

  const data = await base44.entities.ExerciseDetail.list('name', 500);
  cache[key] = { data, time: now() };
  return data;
}

/** Returns a name→image_url map from localStorage (or null if stale/missing). */
export function getCachedImageMap() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed.time || (now() - parsed.time) > LS_TTL) return null;
    return parsed.map || null;
  } catch {
    return null;
  }
}

/** Persists the name→image_url map to localStorage. */
export function saveCachedImageMap(map) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ map, time: now() }));
  } catch {}
}

export function invalidateExerciseCache() {
  delete cache['Exercise_list'];
  delete cache['ExerciseDetail_list'];
}