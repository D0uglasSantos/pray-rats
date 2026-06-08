"use client";

import { useCallback, useEffect, useState } from "react";
import { getFeedCheckins } from "@/actions/checkins";
import type { FeedCheckin, FeedCursor } from "@/types/feed";

const FEED_LIMIT = 20;

export function useFeed(groupId?: string) {
  const [checkins, setCheckins] = useState<FeedCheckin[]>([]);
  const [nextCursor, setNextCursor] = useState<FeedCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (cursor: FeedCursor | null, append = false) => {
      if (!groupId) return;
      setLoading(true);
      const result = await getFeedCheckins(groupId, cursor, FEED_LIMIT);
      setCheckins((prev) => (append ? [...prev, ...result.items] : result.items));
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
      setLoading(false);
    },
    [groupId],
  );

  useEffect(() => {
    if (groupId) {
      setCheckins([]);
      setNextCursor(null);
      load(null);
    }
  }, [groupId, load]);

  const loadMore = useCallback(() => {
    if (nextCursor) load(nextCursor, true);
  }, [nextCursor, load]);

  return { checkins, loading, hasMore, loadMore };
}
