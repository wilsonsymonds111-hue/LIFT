import Skeleton from '../Skeleton';

export default function SplitDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="text-center space-y-1.5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="w-11" />
      </div>
      <div className="flex flex-col gap-3 px-5 pt-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-blue-400/30 p-4 shadow-lg shadow-blue-500/10">
            <Skeleton className="h-5 w-1/2 mb-3" />
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="px-5 pt-4">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}