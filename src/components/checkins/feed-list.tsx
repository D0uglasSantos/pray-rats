"use client";

import { useState, useTransition } from "react";
import { getFeedCheckins } from "@/actions/checkins";
import { CheckinCard } from "@/components/checkins/checkin-card";
import { Button } from "@/components/ui/button";
import { CheckinCardSkeleton } from "@/components/ui/skeleton";

interface FeedListProps {
  groupId: string;
  initialCheckins: Parameters<typeof CheckinCard>[0]["checkin"][];
}

export function FeedList({ groupId, initialCheckins }: FeedListProps) {
  const [checkins, setCheckins] = useState(initialCheckins);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialCheckins.length >= 10);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    startTransition(async () => {
      const nextPage = page + 1;
      const more = await getFeedCheckins(groupId, nextPage, 10);
      setCheckins((prev) => [...prev, ...more]);
      setPage(nextPage);
      setHasMore(more.length >= 10);
    });
  }

  return (
    <div className="space-y-4">
      {checkins.map((checkin) => (
        <CheckinCard key={checkin.id} checkin={checkin} />
      ))}
      {isPending && (
        <>
          <CheckinCardSkeleton />
          <CheckinCardSkeleton />
        </>
      )}
      {hasMore && !isPending && (
        <Button variant="secondary" fullWidth onClick={loadMore}>
          Carregar mais
        </Button>
      )}
    </div>
  );
}
