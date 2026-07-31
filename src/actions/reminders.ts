"use server";

import { createClient } from "@/lib/supabase/server";
import { mapActionError } from "@/lib/errors/map-action-error";
import { DEFAULT_TIMEZONE, isValidTimeZone } from "@/lib/reminders";
import type { ActionResult } from "@/actions/auth";

export interface ReminderPreferences {
  enabled: boolean;
  timezone: string;
}

export async function getReminderPreferences(): Promise<ReminderPreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("daily_reminders_enabled, timezone")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[reminders] getReminderPreferences", error.message);
    }
    return null;
  }

  if (!data) {
    return { enabled: false, timezone: DEFAULT_TIMEZONE };
  }

  return {
    enabled: data.daily_reminders_enabled,
    timezone: data.timezone || DEFAULT_TIMEZONE,
  };
}

export async function updateReminderPreferences(input: {
  enabled: boolean;
  timezone: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const timezone =
    typeof input.timezone === "string" && isValidTimeZone(input.timezone)
      ? input.timezone
      : DEFAULT_TIMEZONE;

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    daily_reminders_enabled: input.enabled,
    timezone,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "notification" }),
    };
  }

  return { success: true };
}
