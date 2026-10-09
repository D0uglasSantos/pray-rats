import { notifyGroupOfCheckinFromTrustedServer } from "@/lib/group-notification-fanout";
import {
  parseMobileCheckinNotificationBody,
  readBearerToken,
} from "@/lib/mobile-checkin-notifications";
import { logServerError, logServerEvent } from "@/lib/monitoring";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type CheckinNotificationRow = {
  id: string;
  group_id: string;
  title: string;
};

export async function POST(request: Request) {
  const token = readBearerToken(request);
  if (!token) return Response.json({ error: "Não autenticado." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const checkinIds = parseMobileCheckinNotificationBody(body);
  if (!checkinIds) {
    return Response.json({ error: "Check-ins inválidos." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    logServerError("mobileCheckinNotifications.config", error);
    return Response.json({ error: "Serviço de notificações indisponível." }, { status: 503 });
  }

  const { data: authData, error: userError } = await admin.auth.getUser(token);
  const user = authData.user;
  if (userError || !user) {
    return Response.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  const recentCutoff = new Date(Date.now() - 60 * 60_000).toISOString();
  const { data, error: checkinsError } = await admin
    .from("checkins")
    .select("id, group_id, title")
    .eq("user_id", user.id)
    .in("id", checkinIds)
    .gte("created_at", recentCutoff);

  if (checkinsError) {
    logServerError("mobileCheckinNotifications.checkins", checkinsError, {
      userId: user.id,
    });
    return Response.json({ error: "Não foi possível validar os check-ins." }, { status: 500 });
  }

  const checkins = (data ?? []) as CheckinNotificationRow[];
  if (checkins.length !== checkinIds.length) {
    return Response.json({ error: "Check-in não encontrado ou expirado." }, { status: 403 });
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    logServerError("mobileCheckinNotifications.profile", profileError, {
      userId: user.id,
    });
  }

  let scheduled = 0;
  let duplicates = 0;

  for (const checkin of checkins) {
    const { error: claimError } = await admin
      .from("mobile_checkin_notification_dispatches")
      .insert({ checkin_id: checkin.id, author_id: user.id });

    if (claimError?.code === "23505") {
      duplicates += 1;
      continue;
    }
    if (claimError) {
      logServerError("mobileCheckinNotifications.claim", claimError, {
        userId: user.id,
        checkinId: checkin.id,
      });
      return Response.json(
        { error: "Atualização do serviço de notificações pendente." },
        { status: 503 },
      );
    }

    await notifyGroupOfCheckinFromTrustedServer(
      checkin.group_id,
      user.id,
      profile?.name ?? "Alguém",
      checkin.title,
    );
    scheduled += 1;
  }

  logServerEvent("mobileCheckinNotifications.schedule", "completed", {
    userId: user.id,
    scheduled,
    duplicates,
  });

  return Response.json({ success: true, scheduled, duplicates });
}
