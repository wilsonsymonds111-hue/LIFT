import Skeleton from '../Skeleton';

const SAFE_AREA_PT = { paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' };

export default function SplitsSkeleton() {
  return (
    <div className="health-gradient pb-20">
      <div className="px-4 pb-3" style={SAFE_AREA_PT}>
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="px-4 mb-5">
        <div className="flex rounded-full p-1 gap-1">
          <Skeleton className="flex-1 h-9 rounded-full" />
          <Skeleton className="flex-1 h-9 rounded-full" />
        </div>
      </div>
      <div className="px-4">
        <Skeleton className="h-11 w-full rounded-2xl mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-border/60">
              <Skeleton className="h-32 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}