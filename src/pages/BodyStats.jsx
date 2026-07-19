import { useMemo } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import BodyStatsCard from '../components/BodyStatsCard';
import FatBurnedCard from '../components/FatBurnedCard';
import BodyStatsSkeleton from '../components/skeletons/BodyStatsSkeleton';

const SAFE_AREA_PT = { paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' };

const SPLIT_CYCLES = {
  'push-pull-legs': { onDays: 3, offDays: 1 },
  'upper-lower': { onDays: 2, offDays: 1 },
  'ul-ppl': { onDays: 5, offDays: 1 },
  'full-body': { onDays: 1, offDays: 1 },
};

export default function BodyStats() {
  const { user } = useAuth();
  const { data: templates = [], isLoading } = useWorkoutTemplates();

  const { currentSplit, targetSessionsPerWeek } = useMemo(() => {
    const active = (templates || []).filter(t => t.isActiveSplit === true);
    const sorted = [...active].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

    // Compute target sessions per week from cycle settings
    const groupId = sorted[0]?.splitGroup;
    let onDays = null;
    let offDays = null;

    const names = sorted.map(t => (t.name || '').toLowerCase());
    const hasUpper = names.some(n => n.includes('upper'));
    const hasLower = names.some(n => n.includes('lower'));
    const hasPush = names.some(n => n.includes('push'));
    const hasPull = names.some(n => n.includes('pull'));
    const hasLegs = names.some(n => n.includes('legs'));

    let splitKey = 'full-body';
    if (hasUpper && hasLower && hasPush && hasPull && hasLegs) splitKey = 'ul-ppl';
    else if (hasPush && hasPull && hasLegs) splitKey = 'push-pull-legs';
    else if (hasUpper && hasLower) splitKey = 'upper-lower';

    const defaults = SPLIT_CYCLES[splitKey];
    if (defaults) { onDays = defaults.onDays; offDays = defaults.offDays; }

    if (!onDays) onDays = Math.max(sorted.length, 1) || 3;
    if (!offDays) offDays = 1;

    const target = Math.round((onDays * 7) / (onDays + offDays));

    return { currentSplit: sorted, targetSessionsPerWeek: target };
  }, [templates]);

  if (isLoading) {
    return <BodyStatsSkeleton />;
  }

  return (
    <div className="health-gradient min-h-screen pb-28">
      <div className="px-4 pb-3" style={SAFE_AREA_PT}>
        <h1 className="text-4xl font-extrabold text-foreground leading-tight">Body Stats</h1>
      </div>

      <div className="px-4 py-2 space-y-3">
        <BodyStatsCard
          templates={currentSplit}
          targetSessionsPerWeek={targetSessionsPerWeek}
        />
        {user?.goalMode === 'cutting' && (
          <FatBurnedCard cutStartDate={user?.cutStartDate} />
        )}
      </div>
    </div>
  );
}