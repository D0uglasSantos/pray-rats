import { createAdminClient } from "@/lib/supabase/admin";
import { isPushConfigured } from "@/lib/push-delivery";
import { sendPushToUser } from "@/lib/send-push-to-user";
import { logServerError, logServerEvent } from "@/lib/monitoring";
import {
  DEFAULT_TIMEZONE,
  REMINDER_LINK,
  getDueReminderSlot,
  getLocalDateString,
  getLocalDayRangeUtc,
  getLocalMinutes,
} from "@/lib/reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Lembretes diários de check-in (manhã/tarde/noite).
 * Chamado pelo Vercel Cron (ver vercel.json) a cada 30 min; para cada usuário
 * com lembretes ativos, envia push se o horário local cair na janela de um
 * slot, se ainda não houve envio para aquele slot/dia e se não há check-in hoje.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logServerError("cron.dailyReminders.config", new Error("CRON_SECRET não configurado"));
    return Response.json({ error: "CRON_SECRET não configurado" }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!isPushConfigured()) {
    return Response.json({ sent: 0, skipped: "push_not_configured" });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    logServerError("cron.dailyReminders.admin", error);
    return Response.json({ error: "Supabase admin indisponível" }, { status: 500 });
  }

  const { data: prefs, error } = await admin
    .from("notification_preferences")
    .select("user_id, timezone")
    .eq("daily_reminders_enabled", true);

  if (error) {
    logServerError("cron.dailyReminders.prefs", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const stats = {
    users: prefs?.length ?? 0,
    sent: 0,
    skippedOutsideWindow: 0,
    skippedAlreadySent: 0,
    skippedCheckedIn: 0,
    errors: 0,
  };

  if (!prefs?.length) {
    return Response.json(stats);
  }

  const now = new Date();

  for (const pref of prefs) {
    try {
      const timeZone =
        typeof pref.timezone === "string" && pref.timezone.length > 0
          ? pref.timezone
          : DEFAULT_TIMEZONE;

      const localMinutes = getLocalMinutes(now, timeZone);
      const localDate = getLocalDateString(now, timeZone);
      if (localMinutes === null || localDate === null) continue;

      const slot = getDueReminderSlot(localMinutes);
      if (!slot) {
        stats.skippedOutsideWindow++;
        continue;
      }

      // Registra o envio antes do push: a PK evita duplicatas mesmo com
      // execuções concorrentes do cron (23505 = outra execução já assumiu).
      const { error: insertError } = await admin
        .from("daily_reminder_sends")
        .insert({ user_id: pref.user_id, slot: slot.slot, local_date: localDate });

      if (insertError) {
        if (insertError.code === "23505") {
          stats.skippedAlreadySent++;
          continue;
        }
        throw insertError;
      }

      const range = getLocalDayRangeUtc(now, timeZone);
      if (range) {
        const { count } = await admin
          .from("checkins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", pref.user_id)
          .neq("status", "rejected")
          .gte("checked_in_at", range.start.toISOString())
          .lt("checked_in_at", range.end.toISOString());

        if ((count ?? 0) > 0) {
          stats.skippedCheckedIn++;
          continue;
        }
      }

      await sendPushToUser(pref.user_id, slot.title, slot.body, REMINDER_LINK);
      stats.sent++;
    } catch (userError) {
      stats.errors++;
      logServerError("cron.dailyReminders.user", userError, { userId: pref.user_id });
    }
  }

  logServerEvent("cron.dailyReminders", "completed", stats);
  return Response.json(stats);
}
