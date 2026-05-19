"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DEFAULT_ACTIVITIES } from "@/lib/constants/activities";
import { generateInviteCode } from "@/lib/invite-code";
import { createClient } from "@/lib/supabase/server";
import { setActiveGroup, type ActionResult } from "@/actions/auth";

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
    return { success: false, error: groupError?.message ?? "Erro ao criar grupo." };
  }

  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "admin",
  });

  if (memberError) {
    return { success: false, error: memberError.message };
  }

  const activities = DEFAULT_ACTIVITIES.map((a) => ({
    group_id: group.id,
    ...a,
  }));

  const { error: activitiesError } = await supabase
    .from("activity_types")
    .insert(activities);

  if (activitiesError) {
    return { success: false, error: activitiesError.message };
  }

  await setActiveGroup(group.id);
  revalidatePath("/");
  redirect("/");
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
    return { success: false, error: error.message };
  }

  await setActiveGroup(groupId as string);
  revalidatePath("/");
  return { success: true, data: { groupId: groupId as string } };
}

export async function joinGroupForm(formData: FormData): Promise<ActionResult> {
  const code = formData.get("invite_code") as string;
  const result = await joinGroupByCode(code);

  if (result.success) {
    redirect("/");
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
    return { success: false, error: error.message };
  }

  revalidatePath(`/groups/${groupId}/admin`);
  revalidatePath("/");
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
    return { success: false, error: error.message };
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

  revalidatePath("/profile");
  redirect("/onboarding");
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
    return { success: false, error: error.message };
  }

  revalidatePath(`/groups/${groupId}/admin`);
  return { success: true };
}

import type { GroupWithRole } from "@/types/database";

export async function getUserGroups(userId: string): Promise<GroupWithRole[]> {
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
