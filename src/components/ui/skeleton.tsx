export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-secondary ${className ?? ""}`}
    />
  );
}

export function CheckinCardSkeleton() {
  return (
    <div className="rounded-2xl bg-surface border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

export function JourneyPageSkeleton() {
  return (
    <div className="space-y-4 pb-6">
      <Skeleton className="h-44 w-full rounded-3xl" />

      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>

      <Skeleton className="h-64 w-full rounded-2xl" />

      <div className="rounded-2xl bg-surface border border-border p-4 space-y-5">
        <Skeleton className="h-5 w-40" />
        {[80, 60, 45, 30].map((w) => (
          <div key={w} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div
              className="h-2 rounded-full animate-pulse bg-surface-secondary"
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>

      <Skeleton className="h-11 w-full rounded-xl" />
    </div>
  );
}
