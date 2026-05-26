import { Skeleton } from "@/components/ui/skeleton";

export default function CheckinLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  );
}
