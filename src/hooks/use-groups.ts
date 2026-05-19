"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GroupWithRole } from "@/types/database";

export function useGroups(userId?: string) {
  const [groups, setGroups] = useState<GroupWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    supabase
      .from("group_members")
      .select("role, groups(*)")
      .eq("user_id", userId)
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
        } else {
          setGroups(
            (data ?? []).map((row) => ({
              ...(row.groups as unknown as GroupWithRole),
              role: row.role as GroupWithRole["role"],
            })),
          );
        }
        setLoading(false);
      });
  }, [userId]);

  return { groups, loading, error };
}
