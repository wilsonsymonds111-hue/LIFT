import Skeleton from '../Skeleton';

const SAFE_AREA_PT = { paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' };

export default function BodyStatsSkeleton() {
  return (
    <div className="health-gradient min-h-screen pb-28">
      <div className="px-4 pb-3" style={SAFE_AREA_PT}>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="px-4 py-2 space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}