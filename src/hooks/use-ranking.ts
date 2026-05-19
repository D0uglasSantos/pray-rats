"use client";

import { useEffect, useState } from "react";
import { getRanking } from "@/actions/profile";
import type { GroupRanking, PeriodType } from "@/types/database";

export function useRanking(groupId?: string, period: PeriodType = "weekly") {
  const [rankings, setRankings] = useState<GroupRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getRanking(groupId, period)
      .then((data) => {
        setRankings(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [groupId, period]);

  return { rankings, loading, error };
}
