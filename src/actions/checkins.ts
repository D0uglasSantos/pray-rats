"use server";

import { revalidatePath } from "next/cache";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { evaluateCheckinLimits } from "@/lib/checkin-rules";
import { calculateStreakFromCheckinDates } from "@/lib/streak";
import { computeUserStatsFromCheckins, normalizeCheckinsForStats } from "@/lib/stats";
import type { ActionResult } from "@/actions/auth";
import type { ActivityType, CheckinVisibility } from "@/types/database";

interface CreateCheckinInput {
  groupId: string;
  activityTypeId: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  visibility: CheckinVisibility;
  imageUrl?: string;
}

async function countCheckinsInRange(
  userId: string,
  activityTypeId: string,
  from: Date,
  to: Date,
): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("checkins")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("activity_type_id", activityTypeId)
    .eq("status", "valid")
    .gte("checked_in_at", from.toISOString())
    .lte("checked_in_at", to.toISOString());

  if (error) return 0;
  return count ?? 0;
}

export async function validateCheckinLimits(
  userId: string,
  activity: ActivityType,
): Promise<{ allowed: boolean; points: number; message?: string }> {
  const now = new Date();

  const daily = activity.daily_limit
    ? await countCheckinsInRange(
        userId,
        activity.id,
        startOfDay(now),
        endOfDay(now),
      )
    : 0;

  const weekly = activity.weekly_limit
    ? await countCheckinsInRange(
        userId,
        activity.id,
        startOfWeek(now, { weekStartsOn: 1 }),
        endOfWeek(now, { weekStartsOn: 1 }),
      )
    : 0;

  return evaluateCheckinLimits(activity, { daily, weekly });
}

export async function createCheckin(
  input: CreateCheckinInput,
): Promise<ActionResult<{ checkinId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const title = input.title.trim();
  if (!title) {
    return { success: false, error: "Informe um título para o check-in." };
  }

  const { data: activity, error: activityError } = await supabase
    .from("activity_types")
    .select("*")
    .eq("id", input.activityTypeId)
    .eq("group_id", input.groupId)
    .eq("is_active", true)
    .single();

  if (activityError || !activity) {
    return { success: false, error: "Atividade não encontrada ou inativa." };
  }

  const validation = await validateCheckinLimits(user.id, activity as ActivityType);

  if (!validation.allowed) {
    return { success: false, error: validation.message ?? "Limite atingido." };
  }

  const { data: checkin, error } = await supabase
    .from("checkins")
    .insert({
      group_id: input.groupId,
      user_id: user.id,
      activity_type_id: input.activityTypeId,
      title,
      description: input.description?.trim() || null,
      duration_minutes: input.durationMinutes || null,
      image_url: input.imageUrl || null,
      visibility: input.visibility,
      points: validation.points,
      status: "valid",
    })
    .select("id")
    .single();

  if (error || !checkin) {
    return { success: false, error: error?.message ?? "Erro ao salvar check-in." };
  }

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/ranking");
  revalidatePath("/journey");
  revalidatePath("/group");

  return { success: true, data: { checkinId: checkin.id } };
}

export async function createCheckinForm(formData: FormData): Promise<ActionResult<{ checkinId: string }>> {
  const result = await createCheckin({
    groupId: formData.get("group_id") as string,
    activityTypeId: formData.get("activity_type_id") as string,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    durationMinutes: formData.get("duration_minutes")
      ? Number(formData.get("duration_minutes"))
      : undefined,
    visibility: (formData.get("visibility") as CheckinVisibility) || "public",
    imageUrl: (formData.get("image_url") as string) || undefined,
  });

  return result;
}

export async function getTodayCheckins(groupId: string, userId: string) {
  const supabase = await createClient();
  const now = new Date();

  const { data } = await supabase
    .from("checkins")
    .select("*, activity_type:activity_types(name, points)")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .gte("checked_in_at", startOfDay(now).toISOString())
    .lte("checked_in_at", endOfDay(now).toISOString())
    .order("checked_in_at", { ascending: false });

  return data ?? [];
}

export async function getFeedCheckins(groupId: string, page = 0, limit = 10) {
  const supabase = await createClient();
  const from = page * limit;
  const to = from + limit - 1;

  const { data, error } = await supabase
    .from("checkins")
    .select("*, profile:profiles(name, avatar_url), activity_type:activity_types(name)")
    .eq("group_id", groupId)
    .eq("visibility", "public")
    .eq("status", "valid")
    .order("checked_in_at", { ascending: false })
    .range(from, to);

  if (error) return [];
  return data ?? [];
}

export async function calculateStreak(userId: string, groupId: string): Promise<number> {
  const supabase = await createClient();

  const { data: checkins } = await supabase
    .from("checkins")
    .select("checked_in_at")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("status", "valid")
    .order("checked_in_at", { ascending: false });

  if (!checkins?.length) return 0;

  return calculateStreakFromCheckinDates(
    checkins.map((c) => c.checked_in_at),
  );
}

export async function getWeeklyPoints(userId: string, groupId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();

  const { data } = await supabase
    .from("checkins")
    .select("points")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("status", "valid")
    .gte("checked_in_at", startOfWeek(now, { weekStartsOn: 1 }).toISOString())
    .lte("checked_in_at", endOfWeek(now, { weekStartsOn: 1 }).toISOString());

  return (data ?? []).reduce((sum, c) => sum + c.points, 0);
}

export async function getUserStats(userId: string, groupId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("checkins")
    .select(
      "id, points, checked_in_at, duration_minutes, image_url, title, activity_type_id, activity_type:activity_types(name)",
    )
    .eq("user_id", userId)
    .eq("status", "valid")
    .order("checked_in_at", { ascending: false });

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data: checkins } = await query;

  const stats = computeUserStatsFromCheckins(
    normalizeCheckinsForStats(checkins ?? []),
  );
  const streak = groupId ? await calculateStreak(userId, groupId) : 0;

  const activeDays = new Set(
    (checkins ?? []).map((c) => startOfDay(new Date(c.checked_in_at)).toISOString()),
  ).size;

  const totalActiveMinutes = (checkins ?? []).reduce(
    (sum, c) => sum + (c.duration_minutes ?? 0),
    0,
  );

  return {
    ...stats,
    currentStreak: streak,
    activeDays,
    totalActiveMinutes,
    checkins: checkins ?? [],
  };
}
