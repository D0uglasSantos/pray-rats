import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getPostgresMonthStartISO,
  getPostgresWeekStartISO,
} from "@/lib/postgres-dates";
import { groupDataTag, SERVER_CACHE_TTL_SECONDS } from "@/lib/server-cache";
import type { GroupRanking, PeriodType } from "@/types/database";
import type { FeedCheckin, FeedResult } from "@/types/feed";

const RANKING_FIELDS =
  "group_id,user_id,name,avatar_url,total_checkins,total_points";

const FEED_SELECT =
  "id, user_id, title, description, points, checked_in_at, image_url, profile:profiles(name, avatar_url), activity_type:activity_types(name)";

type RankingSource = {
  mvTable:
    | "group_rankings_mv"
    | "weekly_group_rankings_mv"
    | "monthly_group_rankings_mv";
  periodFilter?: { column: "week_start" | "month_start"; value: string };
};

function getRankingMvSource(period: PeriodType): RankingSource {
  if (period === "weekly") {
    return {
      mvTable: "weekly_group_rankings_mv",
      periodFilter: { column: "week_start", value: getPostgresWeekStartISO() },
    };
  }

  if (period === "monthly") {
    return {
      mvTable: "monthly_group_rankings_mv",
      periodFilter: { column: "month_start", value: getPostgresMonthStartISO() },
    };
  }

  return { mvTable: "group_rankings_mv" };
}

function mapFeedRows(data: unknown[]): FeedCheckin[] {
  return data.map((row) => {
    const entry = row as Record<string, unknown>;
    const profile = Array.isArray(entry.profile) ? entry.profile[0] : entry.profile;
    const activityType = Array.isArray(entry.activity_type)
      ? entry.activity_type[0]
      : entry.activity_type;

    return {
      id: entry.id as string,
      user_id: entry.user_id as string,
      title: entry.title as string,
      description: entry.description as string | null,
      points: entry.points as number,
      checked_in_at: entry.checked_in_at as string,
      image_url: entry.image_url as string | null,
      profile: (profile as FeedCheckin["profile"]) ?? null,
      activity_type: (activityType as FeedCheckin["activity_type"]) ?? null,
    };
  });
}

async function fetchRankingTopFromMv(
  groupId: string,
  period: PeriodType,
  limit: number,
): Promise<GroupRanking[] | null> {
  try {
    const admin = createAdminClient();
    const source = getRankingMvSource(period);

    let query = admin
      .from(source.mvTable)
      .select(RANKING_FIELDS)
      .eq("group_id", groupId)
      .order("total_points", { ascending: false })
      .order("total_checkins", { ascending: false })
      .order("user_id", { ascending: true })
      .limit(limit);

    if (source.periodFilter) {
      query = query.eq(source.periodFilter.column, source.periodFilter.value);
    }

    const { data, error } = await query;
    if (error) return null;

    return ((data as GroupRanking[]) ?? []).map((entry, index) => ({
      ...entry,
      rank_position: index + 1,
    }));
  } catch {
    return null;
  }
}

async function fetchGroupTotalCheckinsFromMv(
  groupId: string,
): Promise<number | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("group_rankings_mv")
      .select("total_checkins")
      .eq("group_id", groupId);

    if (error) return null;

    return (data ?? []).reduce(
      (sum, row) => sum + (row.total_checkins as number),
      0,
    );
  } catch {
    return null;
  }
}

async function fetchFeedFirstPageFromDb(
  groupId: string,
  limit: number,
): Promise<FeedResult | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("checkins")
      .select(FEED_SELECT)
      .eq("group_id", groupId)
      .eq("visibility", "public")
      .eq("status", "valid")
      .order("checked_in_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit + 1);

    if (error) return null;

    const rows = mapFeedRows(data ?? []);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items.at(-1);
    const nextCursor =
      hasMore && last
        ? { checked_in_at: last.checked_in_at, id: last.id }
        : null;

    return { items, hasMore, nextCursor };
  } catch {
    return null;
  }
}

export async function getCachedRankingTop(
  groupId: string,
  period: PeriodType,
  limit: number,
): Promise<GroupRanking[] | null> {
  const source = getRankingMvSource(period);
  const periodKey = source.periodFilter?.value ?? "all";

  return unstable_cache(
    () => fetchRankingTopFromMv(groupId, period, limit),
    ["ranking-top", groupId, period, String(limit), periodKey],
    {
      revalidate: SERVER_CACHE_TTL_SECONDS,
      tags: [groupDataTag(groupId)],
    },
  )();
}

export async function getCachedGroupTotalCheckins(
  groupId: string,
): Promise<number | null> {
  return unstable_cache(
    () => fetchGroupTotalCheckinsFromMv(groupId),
    ["group-total-checkins", groupId],
    {
      revalidate: SERVER_CACHE_TTL_SECONDS,
      tags: [groupDataTag(groupId)],
    },
  )();
}

export async function getCachedFeedFirstPage(
  groupId: string,
  limit: number,
): Promise<FeedResult | null> {
  return unstable_cache(
    () => fetchFeedFirstPageFromDb(groupId, limit),
    ["feed-first-page", groupId, String(limit)],
    {
      revalidate: SERVER_CACHE_TTL_SECONDS,
      tags: [groupDataTag(groupId)],
    },
  )();
}
