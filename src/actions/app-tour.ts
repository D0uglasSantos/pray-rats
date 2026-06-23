"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapActionError } from "@/lib/errors/map-action-error";
import { CURRENT_APP_TOUR_VERSION } from "@/lib/tutorial/app-tour-version";
import { normalizeAppTourStep } from "@/lib/tutorial/normalize-app-tour-step";
import { APP_TOUR_STEP_COUNT } from "@/lib/tutorial/app-tour-steps";
import type { ActionResult } from "@/actions/auth";
import type { AppTourState, AppTourStatus } from "@/types/database";

const VALID_STATUSES: AppTourStatus[] = [
  "pending",
  "in_progress",
  "completed",
  "dismissed",
];

function parseAppTourState(row: {
  app_tour_version: number;
  app_tour_status: string;
  app_tour_step: number;
}): AppTourState {
  const status = VALID_STATUSES.includes(row.app_tour_status as AppTourStatus)
    ? (row.app_tour_status as AppTourStatus)
    : "pending";

  return {
    version: row.app_tour_version ?? 0,
    status,
    step: normalizeAppTourStep(row.app_tour_step ?? 0, APP_TOUR_STEP_COUNT),
  };
}

const DEFAULT_APP_TOUR_STATE: AppTourState = {
  version: 0,
  status: "pending",
  step: 0,
};

export async function getAppTourState(): Promise<AppTourState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return DEFAULT_APP_TOUR_STATE;

  const { data, error } = await supabase
    .from("profiles")
    .select("app_tour_version, app_tour_status, app_tour_step")
    .eq("id", user.id)
    .single();

  if (error || !data) return DEFAULT_APP_TOUR_STATE;

  return parseAppTourState(data);
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function updateAppTourProgress(step: number): Promise<ActionResult<AppTourState>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Faça login para continuar." };
  }

  const normalizedStep = normalizeAppTourStep(step, APP_TOUR_STEP_COUNT);
  const supabase = await createClient();

  const { data: current, error: readError } = await supabase
    .from("profiles")
    .select("app_tour_status")
    .eq("id", userId)
    .single();

  if (readError) {
    return {
      success: false,
      error: mapActionError(readError, { context: "profile" }),
    };
  }

  const nextStatus: AppTourStatus =
    current?.app_tour_status === "pending" ? "in_progress" : (current?.app_tour_status as AppTourStatus) ?? "in_progress";

  const { data, error } = await supabase
    .from("profiles")
    .update({
      app_tour_version: CURRENT_APP_TOUR_VERSION,
      app_tour_status: nextStatus === "completed" || nextStatus === "dismissed" ? nextStatus : "in_progress",
      app_tour_step: normalizedStep,
      app_tour_updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("app_tour_version, app_tour_status, app_tour_step")
    .single();

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "profile" }),
    };
  }

  return { success: true, data: parseAppTourState(data) };
}

export async function completeAppTour(): Promise<ActionResult<AppTourState>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Faça login para continuar." };
  }

  const supabase = await createClient();
  const finalStep = APP_TOUR_STEP_COUNT - 1;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      app_tour_version: CURRENT_APP_TOUR_VERSION,
      app_tour_status: "completed",
      app_tour_step: finalStep,
      app_tour_updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("app_tour_version, app_tour_status, app_tour_step")
    .single();

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "profile" }),
    };
  }

  revalidatePath("/profile");
  revalidatePath("/home");

  return { success: true, data: parseAppTourState(data) };
}

export async function dismissAppTour(): Promise<ActionResult<AppTourState>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Faça login para continuar." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      app_tour_version: CURRENT_APP_TOUR_VERSION,
      app_tour_status: "dismissed",
      app_tour_updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("app_tour_version, app_tour_status, app_tour_step")
    .single();

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "profile" }),
    };
  }

  revalidatePath("/profile");
  revalidatePath("/home");

  return { success: true, data: parseAppTourState(data) };
}

export async function restartAppTour(): Promise<ActionResult<AppTourState>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "Faça login para continuar." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({
      app_tour_version: CURRENT_APP_TOUR_VERSION,
      app_tour_status: "in_progress",
      app_tour_step: 0,
      app_tour_updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("app_tour_version, app_tour_status, app_tour_step")
    .single();

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "profile" }),
    };
  }

  revalidatePath("/profile");
  revalidatePath("/home");

  return { success: true, data: parseAppTourState(data) };
}
