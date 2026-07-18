import Skeleton from '../Skeleton';

export default function TemplateDetailSkeleton() {
  return (
    <div className="w-[min(440px,92vw)] rounded-3xl bg-card shadow-2xl overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2 pt-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="flex gap-3 pt-2">
          <Skeleton className="flex-1 h-11 rounded-xl" />
          <Skeleton className="flex-1 h-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}