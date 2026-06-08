"use client";

import { useState, useTransition } from "react";
import { getFeedCheckins } from "@/actions/checkins";
import type { FeedCheckin, FeedCursor } from "@/types/feed";
import { CheckinCard } from "@/components/checkins/checkin-card";
import { Button } from "@/components/ui/button";
import { CheckinCardSkeleton } from "@/components/ui/skeleton";

const LOAD_COUNT = 20;

interface FeedListProps {
  groupId: string;
  initialItems: FeedCheckin[];
  initialNextCursor: FeedCursor | null;
  initialHasMore: boolean;
}

export function FeedList({
  groupId,
  initialItems,
  initialNextCursor,
  initialHasMore,
}: FeedListProps) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState<FeedCursor | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isPending, startTransition] = useTransition();

  function loadMore() {
    if (!nextCursor) return;
    startTransition(async () => {
      const result = await getFeedCheckins(groupId, nextCursor, LOAD_COUNT);
      setItems((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    });
  }

  return (
    <div className="space-y-4">
      {items.map((checkin) => (
        <CheckinCard key={checkin.id} checkin={checkin} />
      ))}

      {isPending && (
        <>
          <CheckinCardSkeleton />
          <CheckinCardSkeleton />
          <CheckinCardSkeleton />
        </>
      )}

      {hasMore && !isPending && (
        <Button variant="secondary" fullWidth onClick={loadMore}>
          Carregar mais
        </Button>
      )}

      {!hasMore && items.length > 0 && !isPending && (
        <p className="text-center text-sm text-muted py-4">
          Você chegou ao fim do feed.
        </p>
      )}
    </div>
  );
}
