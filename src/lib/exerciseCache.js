import { base44 } from '@/api/base44Client';

// Simple in-memory cache with TTL to avoid redundant API calls
const cache = {};
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes — exercise data changes rarely

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

export function invalidateExerciseCache() {
  delete cache['Exercise_list'];
  delete cache['ExerciseDetail_list'];
}