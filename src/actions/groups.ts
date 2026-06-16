"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { DEFAULT_ACTIVITIES } from "@/lib/constants/activities";
import { generateInviteCode } from "@/lib/invite-code";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { clearActiveGroup, setActiveGroup, type ActionResult } from "@/actions/auth";
import { notifyGroupOfNewMember } from "@/actions/notifications";
import { mapActionError } from "@/lib/errors/map-action-error";

export async function createGroup(formData: FormData): Promise<ActionResult<{ groupId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;

  if (!name) {
    return { success: false, error: "Informe o nome do grupo." };
  }

  let inviteCode = generateInviteCode();
  let attempts = 0;

  while (attempts < 5) {
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", inviteCode)
      .maybeSingle();

    if (!existing) break;
    inviteCode = generateInviteCode();
    attempts++;
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      description,
      invite_code: inviteCode,
      start_date: startDate,
      end_date: endDate,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (groupError || !group) {
    return {
      success: false,
      error: mapActionError(groupError, {
        context: "group",
        fallback: "Erro ao criar grupo.",
      }),
    };
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberError) {
    return { success: false, error: mapActionError(memberError, { context: "group" }) };
  }

  const activities = DEFAULT_ACTIVITIES.map((a) => ({
    group_id: group.id,
    ...a,
  }));

  const { error: activitiesError } = await supabase
    .from("activity_types")
    .insert(activities);

  if (activitiesError) {
    return { success: false, error: mapActionError(activitiesError, { context: "group" }) };
  }

  await setActiveGroup(group.id);
  revalidatePath("/home");
  redirect("/home");
}

export async function joinGroupByCode(code: string): Promise<ActionResult<{ groupId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) {
    return { success: false, error: "Informe o código de convite." };
  }

  const { data: groupId, error } = await supabase.rpc("join_group_by_invite", {
    invite: trimmed,
  });

  if (error) {
    if (error.message.includes("INVALID_INVITE_CODE")) {
      return { success: false, error: "Código de convite inválido." };
    }
    return { success: false, error: mapActionError(error, { context: "group" }) };
  }

  await setActiveGroup(groupId as string);

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  await notifyGroupOfNewMember(
    groupId as string,
    user.id,
    profile?.name ?? "Alguém",
  );

  revalidatePath("/home");
  revalidatePath("/notifications");
  return { success: true, data: { groupId: groupId as string } };
}

export async function joinGroupForm(formData: FormData): Promise<ActionResult> {
  const code = formData.get("invite_code") as string;
  const result = await joinGroupByCode(code);

  if (result.success) {
    redirect("/home");
  }

  return result;
}

export async function updateGroup(
  groupId: string,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const startDate = (formData.get("start_date") as string) || null;
  const endDate = (formData.get("end_date") as string) || null;

  if (!name) {
    return { success: false, error: "Informe o nome do grupo." };
  }

  const { error } = await supabase
    .from("groups")
    .update({
      name,
      description,
      start_date: startDate,
      end_date: endDate,
    })
    .eq("id", groupId);

  if (error) {
    return { success: false, error: mapActionError(error, { context: "group" }) };
  }

  revalidatePath(`/groups/${groupId}/admin`);
  revalidatePath("/home");
  return { success: true };
}

export async function removeMember(
  groupId: string,
  memberId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId)
    .eq("group_id", groupId);

  if (error) {
    return { success: false, error: mapActionError(error, { context: "group" }) };
  }

  revalidatePath(`/groups/${groupId}/admin`);
  return { success: true };
}

export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  const remainingGroups = await getUserGroups(user.id);
  revalidatePath("/profile");
  revalidatePath("/groups");

  if (remainingGroups.length === 0) {
    await clearActiveGroup();
    redirect("/onboarding");
  }

  const nextActive = remainingGroups[0];
  await setActiveGroup(nextActive.id);
  redirect("/groups");
}

export async function updateActivityType(
  activityId: string,
  groupId: string,
  data: {
    points?: number;
    daily_limit?: number | null;
    weekly_limit?: number | null;
    is_active?: boolean;
    is_private_default?: boolean;
  },
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("activity_types")
    .update(data)
    .eq("id", activityId)
    .eq("group_id", groupId);

  if (error) {
    return { success: false, error: mapActionError(error, { context: "group" }) };
  }

  revalidatePath(`/groups/${groupId}/admin`);
  return { success: true };
}

import type { GroupWithRole } from "@/types/database";

export const getUserGroups = cache(async (userId: string): Promise<GroupWithRole[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_members")
    .select("role, groups(*)")
    .eq("user_id", userId);

  if (error) return [];

  return (data ?? []).map((row) => ({
    ...(row.groups as unknown as GroupWithRole),
    role: row.role as GroupWithRole["role"],
  }));
});

export async function getGroupById(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) return null;
  return data;
}

export async function getGroupStats(
  groupId: string,
  startDate: string | null,
) {
  const supabase = await createClient();

  const { data: rankings } = await supabase
    .from("group_rankings")
    .select("total_checkins")
    .eq("group_id", groupId);

  const totalCheckins =
    rankings?.reduce((sum, row) => sum + row.total_checkins, 0) ?? 0;

  const challengeStart = startDate
    ? startOfDay(new Date(startDate))
    : startOfDay(new Date());
  const daysElapsed = Math.max(
    1,
    differenceInCalendarDays(startOfDay(new Date()), challengeStart) + 1,
  );
  const avgCheckinsPerDay =
    Math.round((totalCheckins / daysElapsed) * 10) / 10;

  return { totalCheckins, avgCheckinsPerDay };
}

export async function getGroupMemberStats(groupId: string) {
  const supabase = await createClient();

  const { data: rankings } = await supabase
    .from("group_rankings")
    .select("user_id, total_points, total_checkins")
    .eq("group_id", groupId);

  const statsMap = new Map(
    (rankings ?? []).map((r) => [r.user_id, r]),
  );

  const members = await getGroupMembers(groupId);

  return members.map((member) => {
    const profile = Array.isArray(member.profile)
      ? member.profile[0]
      : member.profile;
    const stats = statsMap.get(
      (member as { user_id: string }).user_id,
    );

    return {
      id: member.id,
      user_id: (member as { user_id: string }).user_id,
      role: member.role,
      joined_at: member.joined_at,
      profile,
      total_points: stats?.total_points ?? 0,
      total_checkins: stats?.total_checkins ?? 0,
    };
  });
}

export async function getGroupMembers(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("group_members")
    .select("*, profile:profiles(*)")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (error) return [];
  return data ?? [];
}

export async function getGroupActivities(groupId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_types")
    .select("*")
    .eq("group_id", groupId)
    .order("name");

  if (error) return [];
  return data ?? [];
}

export async function getActivitiesByGroupIds(
  groupIds: string[],
): Promise<Record<string, Awaited<ReturnType<typeof getGroupActivities>>>> {
  if (groupIds.length === 0) return {};

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_types")
    .select("*")
    .in("group_id", groupIds)
    .order("name");

  if (error || !data) return {};

  const grouped: Record<string, typeof data> = {};
  for (const groupId of groupIds) {
    grouped[groupId] = [];
  }
  for (const activity of data) {
    grouped[activity.group_id]?.push(activity);
  }

  return grouped;
}

export async function isUserInGroup(groupId: string, userId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function getSharedGroupId(
  viewerId: string,
  targetUserId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data: viewerGroups } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", viewerId);

  const groupIds = (viewerGroups ?? []).map((row) => row.group_id);
  if (groupIds.length === 0) return null;

  const { data } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", targetUserId)
    .in("group_id", groupIds)
    .limit(1)
    .maybeSingle();

  return data?.group_id ?? null;
}

export async function isUserAdmin(groupId: string, userId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  return data?.role === "admin";
}
