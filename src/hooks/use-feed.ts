"use client";

import { useCallback, useEffect, useState } from "react";
import { getFeedCheckins } from "@/actions/checkins";

type FeedCheckin = Awaited<ReturnType<typeof getFeedCheckins>>[number];

export function useFeed(groupId?: string) {
  const [checkins, setCheckins] = useState<FeedCheckin[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    async (pageNum: number, append = false) => {
      if (!groupId) return;
      setLoading(true);
      const data = await getFeedCheckins(groupId, pageNum, 10);
      setCheckins((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length >= 10);
      setLoading(false);
    },
    [groupId],
  );

  useEffect(() => {
    if (groupId) {
      setPage(0);
      load(0);
    }
  }, [groupId, load]);

  const loadMore = useCallback(() => {
    const next = page + 1;
    setPage(next);
    load(next, true);
  }, [page, load]);

  return { checkins, loading, hasMore, loadMore };
}
