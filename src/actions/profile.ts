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

export async function getRanking(
  groupId: string,
  period: PeriodType = "weekly",
): Promise<GroupRanking[]> {
  const supabase = await createClient();

  if (period === "general") {
    const { data } = await supabase
      .from("group_rankings")
      .select("*")
      .eq("group_id", groupId)
      .order("total_points", { ascending: false });

    return (data as GroupRanking[]) ?? [];
  }

  if (period === "weekly") {
    const weekStart = getPostgresWeekStartISO();

    const { data } = await supabase
      .from("weekly_group_rankings")
      .select("*")
      .eq("group_id", groupId)
      .eq("week_start", weekStart)
      .order("total_points", { ascending: false });

    return (data as GroupRanking[]) ?? [];
  }

  const monthStart = getPostgresMonthStartISO();

  const { data } = await supabase
    .from("monthly_group_rankings")
    .select("*")
    .eq("group_id", groupId)
    .eq("month_start", monthStart)
    .order("total_points", { ascending: false });

  return (data as GroupRanking[]) ?? [];
}

export async function getUserRankingPosition(
  groupId: string,
  userId: string,
  period: PeriodType = "weekly",
): Promise<number | null> {
  const ranking = await getRanking(groupId, period);
  const index = ranking.findIndex((r) => r.user_id === userId);
  return index >= 0 ? index + 1 : null;
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
  revalidatePath("/");
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
