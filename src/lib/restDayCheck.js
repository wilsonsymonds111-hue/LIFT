import { base44 } from '@/api/base44Client';

const SPLIT_CYCLES = {
  'push-pull-legs': { onDays: 3, offDays: 1 },
  'upper-lower': { onDays: 2, offDays: 1 },
  'ul-ppl': { onDays: 5, offDays: 1 },
  'full-body': { onDays: 1, offDays: 1 },
};

function deriveSplitKey(templates) {
  const names = templates.map(t => (t.name || '').toLowerCase());
  const hasUpper = names.some(n => n.includes('upper'));
  const hasLower = names.some(n => n.includes('lower'));
  const hasPush  = names.some(n => n.includes('push'));
  const hasPull  = names.some(n => n.includes('pull'));
  const hasLegs  = names.some(n => n.includes('legs'));
  const hasFull  = names.some(n => n.includes('full'));

  if (hasUpper && hasLower && hasPush && hasPull && hasLegs) return 'ul-ppl';
  if (hasPush && hasPull && hasLegs) return 'push-pull-legs';
  if (hasUpper && hasLower) return 'upper-lower';
  if (hasFull && !hasUpper && !hasLower) return 'full-body';
  return 'full-body';
}

function getActiveSplit(templates) {
  const hasActive = templates.some(t => t.isActiveSplit === true);
  return hasActive
    ? templates.filter(t => t.isActiveSplit === true)
    : templates.filter(t => !t.splitGroup || t.splitGroup === '');
}

function loadCycleParams(templates) {
  const split = getActiveSplit(templates);
  if (split.length === 0) return null;

  const groupId = split[0].splitGroup;
  const splitKey = deriveSplitKey(split);

  // Check DB templates for persisted cycle settings (survives app reinstall)
  const dbCycle = split.find(t => t.cycleOnDays != null);
  if (dbCycle && dbCycle.cycleStartDayIndex != null && !isNaN(dbCycle.cycleStartDayIndex)) {
    return {
      onDays: dbCycle.cycleOnDays,
      offDays: dbCycle.cycleOffDays,
      savedStartDayIndex: dbCycle.cycleStartDayIndex,
      storageKey: groupId || splitKey,
    };
  }

  const defaultCycle = SPLIT_CYCLES[splitKey];
  let onDays = defaultCycle ? defaultCycle.onDays : null;
  let offDays = defaultCycle ? defaultCycle.offDays : null;
  let savedStartDayIndex = null;
  let storageKey = null;

  try {
    const keysToTry = [splitKey, groupId].filter(Boolean);
    for (const k of keysToTry) {
      const cycleRaw = localStorage.getItem(`splitCycle_${k}`);
      if (cycleRaw) {
        const parsed = JSON.parse(cycleRaw);
        onDays = Number(parsed.onDays) || onDays;
        offDays = Number(parsed.offDays) || offDays;
        savedStartDayIndex = Number(parsed.startDayIndex);
        storageKey = k;
        break;
      }
    }
  } catch {}

  if (!onDays) onDays = Math.max(split.length, 1);
  if (!offDays) offDays = 1;
  if (!storageKey) storageKey = groupId || splitKey;

  return { onDays, offDays, savedStartDayIndex, storageKey };
}

export function isRestDayToday(templates) {
  const params = loadCycleParams(templates);
  if (!params) return false;
  const { onDays, offDays, savedStartDayIndex } = params;

  // No saved start day → default makes today a workout day
  if (savedStartDayIndex === null || isNaN(savedStartDayIndex)) return false;

  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;
  const todayAbs = Math.floor(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) / 86400000);

  const cycleLength = onDays + offDays;
  const startAbs = todayAbs - todayMonSun + savedStartDayIndex;
  const offset = todayAbs - startAbs;
  const pos = ((offset % cycleLength) + cycleLength) % cycleLength;

  return pos >= onDays;
}

export function makeTodayWorkoutDay(templates) {
  const params = loadCycleParams(templates);
  if (!params) return;
  const { onDays, offDays, storageKey } = params;

  const todayIndex = new Date().getDay();
  const todayMonSun = todayIndex === 0 ? 6 : todayIndex - 1;

  const cycle = { onDays, offDays, startDayIndex: todayMonSun };
  localStorage.setItem(`splitCycle_${storageKey}`, JSON.stringify(cycle));

  // Persist to DB so it survives app reinstall
  const split = getActiveSplit(templates);
  const ids = split.map(t => t.id).filter(Boolean);
  if (ids.length > 0) {
    Promise.all(ids.map(id =>
      base44.entities.WorkoutTemplate.update(id, {
        cycleOnDays: onDays,
        cycleOffDays: offDays,
        cycleStartDayIndex: todayMonSun,
      })
    )).catch(() => {});
  }

  window.dispatchEvent(new CustomEvent('scheduleChanged'));
}