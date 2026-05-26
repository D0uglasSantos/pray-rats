import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-24 rounded-full mx-auto" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
