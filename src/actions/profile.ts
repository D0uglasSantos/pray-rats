"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapActionError } from "@/lib/errors/map-action-error";
import {
  getPostgresMonthStartISO,
  getPostgresWeekStartISO,
} from "@/lib/postgres-dates";
import type { ActionResult } from "@/actions/auth";
import type { GroupRanking, PeriodType } from "@/types/database";

const RANKING_FIELDS = "group_id,user_id,name,avatar_url,total_checkins,total_points";
const RANKING_LIMIT_DEFAULT = 50;

type RankingSource = {
  table: "group_rankings" | "weekly_group_rankings" | "monthly_group_rankings";
  periodFilter?: { column: "week_start" | "month_start"; value: string };
};

function getRankingSource(period: PeriodType): RankingSource {
  if (period === "weekly") {
    return {
      table: "weekly_group_rankings",
      periodFilter: { column: "week_start", value: getPostgresWeekStartISO() },
    };
  }

  if (period === "monthly") {
    return {
      table: "monthly_group_rankings",
      periodFilter: { column: "month_start", value: getPostgresMonthStartISO() },
    };
  }

  return { table: "group_rankings" };
}

async function getCurrentUserRankingEntry(
  groupId: string,
  period: PeriodType,
  userId: string,
): Promise<GroupRanking | null> {
  const supabase = await createClient();
  const source = getRankingSource(period);
  let query = supabase
    .from(source.table)
    .select(RANKING_FIELDS)
    .eq("group_id", groupId)
    .eq("user_id", userId);

  if (source.periodFilter) {
    query = query.eq(source.periodFilter.column, source.periodFilter.value);
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;

  let rankCountQuery = supabase
    .from(source.table)
    .select("user_id", { count: "exact", head: true })
    .eq("group_id", groupId)
    .gt("total_points", data.total_points);

  if (source.periodFilter) {
    rankCountQuery = rankCountQuery.eq(
      source.periodFilter.column,
      source.periodFilter.value,
    );
  }

  const { count } = await rankCountQuery;
  return { ...(data as GroupRanking), rank_position: (count ?? 0) + 1 };
}

export async function getRanking(
  groupId: string,
  period: PeriodType = "weekly",
  options: { limit?: number; currentUserId?: string } = {},
): Promise<GroupRanking[]> {
  const supabase = await createClient();
  const source = getRankingSource(period);
  const limit = Math.max(1, options.limit ?? RANKING_LIMIT_DEFAULT);

  let topQuery = supabase
    .from(source.table)
    .select(RANKING_FIELDS)
    .eq("group_id", groupId)
    .order("total_points", { ascending: false })
    .order("total_checkins", { ascending: false })
    .order("user_id", { ascending: true })
    .limit(limit);

  if (source.periodFilter) {
    topQuery = topQuery.eq(source.periodFilter.column, source.periodFilter.value);
  }

  const { data } = await topQuery;
  const ranking = ((data as GroupRanking[]) ?? []).map((entry, index) => ({
    ...entry,
    rank_position: index + 1,
  }));

  if (!options.currentUserId) return ranking;

  const alreadyVisible = ranking.some((row) => row.user_id === options.currentUserId);
  if (alreadyVisible) return ranking;

  const currentUserEntry = await getCurrentUserRankingEntry(
    groupId,
    period,
    options.currentUserId,
  );
  if (!currentUserEntry) return ranking;

  return [...ranking, currentUserEntry];
}

export async function getUserRankingPosition(
  groupId: string,
  userId: string,
  period: PeriodType = "weekly",
): Promise<number | null> {
  const currentUserEntry = await getCurrentUserRankingEntry(groupId, period, userId);
  return currentUserEntry?.rank_position ?? null;
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const name = (formData.get("name") as string)?.trim();
  const bio = (formData.get("bio") as string)?.trim() || null;

  if (!name) {
    return { success: false, error: "Informe seu nome." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ name, bio })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: mapActionError(error, { context: "profile" }) };
  }

  revalidatePath("/profile");
  revalidatePath("/home");
  return { success: true };
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    return { success: false, error: "Selecione uma imagem." };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "Imagem deve ter no máximo 2MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return {
      success: false,
      error: mapActionError(uploadError, { context: "upload" }),
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
    .eq("id", user.id);

  revalidatePath("/profile");
  return { success: true, data: { url: publicUrl } };
}

export async function getProfile(userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  return data;
}
