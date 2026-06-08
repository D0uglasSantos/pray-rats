import { CheckinCardSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1 mb-6">
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-4 w-48" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <CheckinCardSkeleton key={i} />
      ))}
    </div>
  );
}
