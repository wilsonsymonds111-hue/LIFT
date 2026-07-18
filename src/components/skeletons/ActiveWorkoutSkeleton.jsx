import Skeleton from '../Skeleton';

export default function ActiveWorkoutSkeleton() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div className="flex justify-center items-center pt-12 pb-3">
        <Skeleton className="h-1.5 w-10 rounded-full" />
      </div>
      <div className="flex items-center justify-between px-4 pb-2">
        <Skeleton className="h-11 w-28 rounded-xl" />
        <Skeleton className="h-11 w-24 rounded-xl" />
      </div>
      <div className="flex-1 overflow-hidden px-4 pt-2 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full rounded-full" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
              <Skeleton className="h-10 flex-1 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}