"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { calculateStreakFromCheckinDates } from "@/lib/streak";
import { computeUserStatsFromCheckins, normalizeCheckinsForStats } from "@/lib/stats";
import { computeUserRecords } from "@/lib/user-records";
import { mapActionError } from "@/lib/errors/map-action-error";
import {
  buildGroupActivityOptions,
  normalizeSelectedGroupIds,
  parseGroupIdsFromForm,
} from "@/lib/checkin-groups";
import { parseCheckedInAtInput } from "@/lib/checkin-datetime";
import { notifyGroupOfCheckin } from "@/actions/notifications";
import { getActivitiesByGroupIds, getUserGroups } from "@/actions/groups";
import type { ActionResult } from "@/actions/auth";
import type {
  Checkin,
  CheckinEditContext,
  CheckinVisibility,
  GroupWithRole,
} from "@/types/database";
import type { FeedCursor, FeedCheckin, FeedResult } from "@/types/feed";

interface CheckinPayload {
  activityName: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  distanceKm?: number;
  visibility: CheckinVisibility;
  imageUrl?: string;
  checkedInAt: string;
}

interface CreateCheckinsInput extends CheckinPayload {
  groupIds: string[];
}

interface UpdateCheckinsInput extends CheckinPayload {
  checkinId: string;
  groupIds: string[];
}

interface MultiGroupCheckinResult {
  checkinIds: string[];
  failures: { groupId: string; groupName: string; error: string }[];
}

function mapCheckinRpcError(error: { message?: string } | null): string {
  const message = String(error?.message ?? "");

  if (message.includes("DAILY_LIMIT_REACHED")) {
    return "Limite diário atingido para esta atividade.";
  }
  if (message.includes("WEEKLY_LIMIT_REACHED")) {
    return "Limite semanal atingido para esta atividade.";
  }
  if (message.includes("ACTIVITY_NOT_FOUND_OR_INACTIVE")) {
    return "Atividade não encontrada ou inativa.";
  }
  if (message.includes("GROUP_MEMBERSHIP_REQUIRED")) {
    return "Você não pertence a este grupo.";
  }
  if (message.includes("NOT_AUTHENTICATED")) {
    return "Faça login para continuar.";
  }
  if (message.includes("CHECKIN_TITLE_REQUIRED")) {
    return "Informe um título para o check-in.";
  }
  if (message.includes("CHECKIN_DATETIME_FUTURE")) {
    return "A data não pode ser no futuro.";
  }

  return mapActionError(error, { context: "checkin" });
}

function revalidateCheckinPaths() {
  revalidatePath("/home");
  revalidatePath("/feed");
  revalidatePath("/ranking");
  revalidatePath("/journey");
  revalidatePath("/group");
  revalidatePath("/groups");
  revalidatePath("/check-in");
  revalidatePath("/notifications");
}

async function createCheckinInGroup(
  groupId: string,
  activityTypeId: string,
  payload: CheckinPayload,
  batchId: string,
): Promise<ActionResult<{ checkinId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const title = payload.title.trim();
  if (!title) {
    return { success: false, error: "Informe um título para o check-in." };
  }

  const { data: checkinId, error } = await supabase.rpc("create_checkin_safely", {
    group_id: groupId,
    activity_type_id: activityTypeId,
    title,
    description: payload.description?.trim() || null,
    duration_minutes: payload.durationMinutes || null,
    distance_km: payload.distanceKm || null,
    visibility: payload.visibility,
    image_url: payload.imageUrl || null,
    batch_id: batchId,
    checked_in_at: payload.checkedInAt,
  });

  if (error || !checkinId) {
    return { success: false, error: mapCheckinRpcError(error) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  await notifyGroupOfCheckin(
    groupId,
    user.id,
    profile?.name ?? "Alguém",
    title,
    checkinId as string,
  );

  return { success: true, data: { checkinId: checkinId as string } };
}

export async function createCheckinsForGroups(
  input: CreateCheckinsInput,
): Promise<ActionResult<MultiGroupCheckinResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const userGroups = (await getUserGroups(user.id)) as GroupWithRole[];
  const targetGroupIds = normalizeSelectedGroupIds(
    input.groupIds,
    userGroups.map((group) => group.id),
  );

  if (targetGroupIds.length === 0) {
    return { success: false, error: "Selecione ao menos um grupo." };
  }

  const checkedInAtResult = parseCheckedInAtInput(input.checkedInAt);
  if (!checkedInAtResult.ok) {
    return { success: false, error: checkedInAtResult.error };
  }
  const checkedInAt = checkedInAtResult.iso;

  const activitiesByGroupId = await getActivitiesByGroupIds(targetGroupIds);
  const options = buildGroupActivityOptions(
    userGroups.filter((group) => targetGroupIds.includes(group.id)),
    activitiesByGroupId,
    input.activityName,
  );

  const batchId = randomUUID();
  const checkinIds: string[] = [];
  const failures: MultiGroupCheckinResult["failures"] = [];

  for (const option of options) {
    if (!option.activity) {
      failures.push({
        groupId: option.group.id,
        groupName: option.group.name,
        error: option.unavailableReason ?? "Atividade indisponível neste grupo.",
      });
      continue;
    }

    const result = await createCheckinInGroup(
      option.group.id,
      option.activity.id,
      { ...input, checkedInAt },
      batchId,
    );

    if (result.success && result.data?.checkinId) {
      checkinIds.push(result.data.checkinId);
      continue;
    }

    failures.push({
      groupId: option.group.id,
      groupName: option.group.name,
      error: result.success ? "Erro desconhecido." : result.error,
    });
  }

  if (checkinIds.length === 0) {
    return {
      success: false,
      error: failures[0]?.error ?? "Não foi possível registrar o check-in.",
    };
  }

  revalidateCheckinPaths();

  return {
    success: true,
    data: { checkinIds, failures },
  };
}

export async function createCheckinForm(
  formData: FormData,
): Promise<ActionResult<MultiGroupCheckinResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const userGroups = await getUserGroups(user.id);
  const parsedGroupIds = parseGroupIdsFromForm(formData);
  const groupIds =
    parsedGroupIds.length > 0
      ? parsedGroupIds
      : userGroups.map((group) => group.id);

  const activityTypeId = formData.get("activity_type_id") as string;
  const sourceGroupId = formData.get("source_group_id") as string;
  const activities = await getActivitiesByGroupIds([sourceGroupId]);
  const activity = (activities[sourceGroupId] ?? []).find(
    (item) => item.id === activityTypeId,
  );

  if (!activity) {
    return { success: false, error: "Selecione uma atividade válida." };
  }

  const distanceRaw = formData.get("distance_km") as string;
  const checkedInAtRaw = formData.get("checked_in_at") as string;
  const checkedInAtResult = parseCheckedInAtInput(checkedInAtRaw);
  if (!checkedInAtResult.ok) {
    return { success: false, error: checkedInAtResult.error };
  }

  return createCheckinsForGroups({
    groupIds,
    activityName: activity.name,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    durationMinutes: formData.get("duration_minutes")
      ? Number(formData.get("duration_minutes"))
      : undefined,
    distanceKm: distanceRaw ? Number(distanceRaw) : undefined,
    visibility: (formData.get("visibility") as CheckinVisibility) || "public",
    imageUrl: (formData.get("image_url") as string) || undefined,
    checkedInAt: checkedInAtResult.iso,
  });
}

export async function getCheckinForEdit(
  checkinId: string,
): Promise<CheckinEditContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: checkin } = await supabase
    .from("checkins")
    .select("*, activity_type:activity_types(*)")
    .eq("id", checkinId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!checkin) return null;

  let batchQuery = supabase
    .from("checkins")
    .select("id, group_id, groups(name)")
    .eq("user_id", user.id);

  if (checkin.batch_id) {
    batchQuery = batchQuery.eq("batch_id", checkin.batch_id);
  } else {
    batchQuery = batchQuery.eq("id", checkin.id);
  }

  const { data: batchRows } = await batchQuery.order("checked_in_at", { ascending: true });

  const batchEntries = (batchRows ?? []).map((row) => {
    const groups = row.groups as { name: string } | { name: string }[] | null | undefined;
    return {
      id: row.id as string,
      group_id: row.group_id as string,
      group_name:
        (Array.isArray(groups) ? groups[0]?.name : groups?.name) ?? "Grupo",
    };
  });

  const userGroups = (await getUserGroups(user.id)) as GroupWithRole[];
  const batchGroupIds = batchEntries.map((entry) => entry.group_id);
  const editableGroupIds = userGroups
    .map((group) => group.id)
    .filter((groupId) => batchGroupIds.includes(groupId));

  const activitiesByGroupId = await getActivitiesByGroupIds(editableGroupIds);

  return {
    checkin: checkin as CheckinEditContext["checkin"],
    batchEntries,
    activitiesByGroupId,
  };
}

export async function updateCheckinsForGroups(
  input: UpdateCheckinsInput,
): Promise<ActionResult<MultiGroupCheckinResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const context = await getCheckinForEdit(input.checkinId);
  if (!context) {
    return { success: false, error: "Check-in não encontrado." };
  }

  const allowedGroupIds = context.batchEntries.map((entry) => entry.group_id);
  const targetGroupIds = normalizeSelectedGroupIds(input.groupIds, allowedGroupIds);

  if (targetGroupIds.length === 0) {
    return { success: false, error: "Selecione ao menos um grupo." };
  }

  const title = input.title.trim();
  if (!title) {
    return { success: false, error: "Informe um título para o check-in." };
  }

  const checkedInAtResult = parseCheckedInAtInput(input.checkedInAt);
  if (!checkedInAtResult.ok) {
    return { success: false, error: checkedInAtResult.error };
  }
  const checkedInAt = checkedInAtResult.iso;

  const userGroups = (await getUserGroups(user.id)) as GroupWithRole[];
  const options = buildGroupActivityOptions(
    userGroups.filter((group) => targetGroupIds.includes(group.id)),
    context.activitiesByGroupId,
    input.activityName,
  );

  const updatedIds: string[] = [];
  const failures: MultiGroupCheckinResult["failures"] = [];

  for (const option of options) {
    const batchEntry = context.batchEntries.find((entry) => entry.group_id === option.group.id);
    if (!batchEntry) continue;

    if (!option.activity) {
      failures.push({
        groupId: option.group.id,
        groupName: option.group.name,
        error: option.unavailableReason ?? "Atividade indisponível neste grupo.",
      });
      continue;
    }

    const { error } = await supabase
      .from("checkins")
      .update({
        title,
        description: input.description?.trim() || null,
        duration_minutes: input.durationMinutes || null,
        distance_km: input.distanceKm || null,
        visibility: input.visibility,
        image_url: input.imageUrl || null,
        activity_type_id: option.activity.id,
        points: option.activity.points,
        checked_in_at: checkedInAt,
      })
      .eq("id", batchEntry.id)
      .eq("user_id", user.id);

    if (error) {
      failures.push({
        groupId: option.group.id,
        groupName: option.group.name,
        error: mapActionError(error, { context: "checkin" }),
      });
      continue;
    }

    updatedIds.push(batchEntry.id);
  }

  if (updatedIds.length === 0) {
    return {
      success: false,
      error: failures[0]?.error ?? "Não foi possível atualizar o check-in.",
    };
  }

  revalidateCheckinPaths();
  revalidatePath(`/check-in/${input.checkinId}/edit`);

  return {
    success: true,
    data: { checkinIds: updatedIds, failures },
  };
}

export async function updateCheckinForm(formData: FormData): Promise<ActionResult<MultiGroupCheckinResult>> {
  const checkinId = formData.get("checkin_id") as string;
  const activityTypeId = formData.get("activity_type_id") as string;
  const sourceGroupId = formData.get("source_group_id") as string;
  const activities = await getActivitiesByGroupIds([sourceGroupId]);
  const activity = (activities[sourceGroupId] ?? []).find(
    (item) => item.id === activityTypeId,
  );

  if (!activity) {
    return { success: false, error: "Selecione uma atividade válida." };
  }

  const distanceRaw = formData.get("distance_km") as string;
  const groupIds = parseGroupIdsFromForm(formData);
  const checkedInAtRaw = formData.get("checked_in_at") as string;
  const checkedInAtResult = parseCheckedInAtInput(checkedInAtRaw);
  if (!checkedInAtResult.ok) {
    return { success: false, error: checkedInAtResult.error };
  }

  return updateCheckinsForGroups({
    checkinId,
    groupIds,
    activityName: activity.name,
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    durationMinutes: formData.get("duration_minutes")
      ? Number(formData.get("duration_minutes"))
      : undefined,
    distanceKm: distanceRaw ? Number(distanceRaw) : undefined,
    visibility: (formData.get("visibility") as CheckinVisibility) || "public",
    imageUrl: (formData.get("image_url") as string) || undefined,
    checkedInAt: checkedInAtResult.iso,
  });
}

export async function deleteCheckinsForGroups(
  checkinId: string,
  groupIds: string[],
): Promise<ActionResult<MultiGroupCheckinResult>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const context = await getCheckinForEdit(checkinId);
  if (!context) {
    return { success: false, error: "Check-in não encontrado." };
  }

  const allowedGroupIds = context.batchEntries.map((entry) => entry.group_id);
  const targetGroupIds = normalizeSelectedGroupIds(groupIds, allowedGroupIds);

  if (targetGroupIds.length === 0) {
    return { success: false, error: "Selecione ao menos um grupo." };
  }

  const deletedIds: string[] = [];
  const failures: MultiGroupCheckinResult["failures"] = [];

  for (const groupId of targetGroupIds) {
    const batchEntry = context.batchEntries.find((entry) => entry.group_id === groupId);
    if (!batchEntry) continue;

    const { error } = await supabase
      .from("checkins")
      .delete()
      .eq("id", batchEntry.id)
      .eq("user_id", user.id);

    if (error) {
      failures.push({
        groupId,
        groupName: batchEntry.group_name,
        error: mapActionError(error, { context: "checkin" }),
      });
      continue;
    }

    deletedIds.push(batchEntry.id);
  }

  if (deletedIds.length === 0) {
    return {
      success: false,
      error: failures[0]?.error ?? "Não foi possível excluir o check-in.",
    };
  }

  revalidateCheckinPaths();

  return {
    success: true,
    data: { checkinIds: deletedIds, failures },
  };
}

export async function deleteCheckinForm(formData: FormData): Promise<ActionResult<MultiGroupCheckinResult>> {
  const checkinId = formData.get("checkin_id") as string;
  const groupIds = parseGroupIdsFromForm(formData);

  return deleteCheckinsForGroups(checkinId, groupIds);
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

const FEED_SELECT =
  "id, user_id, title, description, points, checked_in_at, image_url, profile:profiles(name, avatar_url), activity_type:activity_types(name)";

const FEED_LIMIT = 20;

export async function getFeedCheckins(
  groupId: string,
  cursor: FeedCursor | null = null,
  limit = FEED_LIMIT,
): Promise<FeedResult> {
  const supabase = await createClient();

  let query = supabase
    .from("checkins")
    .select(FEED_SELECT)
    .eq("group_id", groupId)
    .eq("visibility", "public")
    .eq("status", "valid")
    .order("checked_in_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.or(
      `checked_in_at.lt.${cursor.checked_in_at},and(checked_in_at.eq.${cursor.checked_in_at},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;

  if (error) return { items: [], hasMore: false, nextCursor: null };

  const rows: FeedCheckin[] = (data ?? []).map((row) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const activityType = Array.isArray(row.activity_type)
      ? row.activity_type[0]
      : row.activity_type;

    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      description: row.description,
      points: row.points,
      checked_in_at: row.checked_in_at,
      image_url: row.image_url,
      profile: profile ?? null,
      activity_type: activityType ?? null,
    };
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  const nextCursor: FeedCursor | null =
    hasMore && last ? { checked_in_at: last.checked_in_at, id: last.id } : null;

  return { items, hasMore, nextCursor };
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

export async function getDailyPoints(userId: string, groupId: string): Promise<number> {
  const supabase = await createClient();
  const now = new Date();

  const { data } = await supabase
    .from("checkins")
    .select("points")
    .eq("user_id", userId)
    .eq("group_id", groupId)
    .eq("status", "valid")
    .gte("checked_in_at", startOfDay(now).toISOString())
    .lte("checked_in_at", endOfDay(now).toISOString());

  return (data ?? []).reduce((sum, c) => sum + c.points, 0);
}

export async function getUserRecords(userId: string, groupId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("checkins")
    .select("checked_in_at, duration_minutes, distance_km, points")
    .eq("user_id", userId)
    .eq("status", "valid");

  if (groupId) {
    query = query.eq("group_id", groupId);
  }

  const { data: checkins } = await query;

  return computeUserRecords(checkins ?? []);
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
