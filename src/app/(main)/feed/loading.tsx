import { CheckinCardSkeleton } from "@/components/ui/skeleton";

export default function FeedLoading() {
  return (
    <div className="space-y-4">
      <CheckinCardSkeleton />
      <CheckinCardSkeleton />
      <CheckinCardSkeleton />
    </div>
  );
}
