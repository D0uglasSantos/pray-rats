import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Atualiza materialized views de ranking após mutações de check-in.
 * Fail-open se migration 015 não estiver aplicada ou service role ausente.
 */
export function scheduleRankingRefresh(): void {
  after(async () => {
    try {
      const admin = createAdminClient();
      const { error } = await admin.rpc("refresh_ranking_views");
      if (error && process.env.NODE_ENV === "development") {
        console.warn("[ranking-cache] refresh_ranking_views", error.message);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[ranking-cache] scheduleRankingRefresh", error);
      }
    }
  });
}
