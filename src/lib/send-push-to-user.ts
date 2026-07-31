import { createAdminClient } from "@/lib/supabase/admin";
import {
  isDeadPushSubscription,
  isPushConfigured,
  logPushEvent,
  sendPushWithRetry,
} from "@/lib/push-delivery";
import { logServerError } from "@/lib/monitoring";

/**
 * Envia Web Push para todas as subscriptions de um usuário.
 * Best-effort: falhas são logadas, nunca lançadas.
 * Server-only — usa service role para ler push_subscriptions.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  link: string,
): Promise<void> {
  if (!isPushConfigured()) return;

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    logServerError("push.sendToUser.admin", error, { userId });
    return;
  }

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions?.length) return;

  const webpush = await import("web-push");
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const payload = JSON.stringify({ title, body, link });

  for (const sub of subscriptions) {
    const result = await sendPushWithRetry(async () => {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      );
    });

    if (result.ok) continue;

    const statusCode = result.statusCode;

    if (isDeadPushSubscription(statusCode)) {
      await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      logPushEvent("subscription_removed", { userId, endpoint: sub.endpoint, statusCode });
      continue;
    }

    logPushEvent("delivery_failed", {
      userId,
      endpoint: sub.endpoint,
      statusCode,
      message:
        result.error instanceof Error ? result.error.message : String(result.error),
    });
  }
}
