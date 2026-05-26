import { Skeleton } from "@/components/ui/skeleton";

export default function RankingLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
