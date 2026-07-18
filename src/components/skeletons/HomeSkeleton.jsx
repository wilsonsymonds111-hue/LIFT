import Skeleton from '../Skeleton';

const SAFE_AREA_PT = { paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' };

export default function HomeSkeleton() {
  return (
    <div className="health-gradient min-h-screen pb-28">
      <div className="px-4 pb-3 flex items-center justify-between" style={SAFE_AREA_PT}>
        <Skeleton className="h-9 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
      </div>
      <div className="py-5 px-4">
        <div className="flex justify-between gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-2.5 w-8" />
            </div>
          ))}
        </div>
      </div>
      <div className="px-4 py-2">
        <Skeleton className="h-3.5 w-24 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border-2 border-border overflow-hidden">
              <Skeleton className="h-28 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}