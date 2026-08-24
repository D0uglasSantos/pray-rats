import { createAdminClient } from "@/lib/supabase/admin";
import { logServerError } from "@/lib/monitoring";
import { logPushEvent } from "@/lib/push-delivery";

type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

export function isExpoPushToken(value: string): boolean {
  return /^(Expo|Exponent)PushToken\[[^\]]+\]$/.test(value);
}

export async function sendExpoPushToUser(
  userId: string,
  title: string,
  body: string,
  link: string,
): Promise<number> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    logServerError("push.expo.admin", error, { userId });
    return 0;
  }

  const { data: devices, error: devicesError } = await admin
    .from("mobile_push_devices")
    .select("id, expo_push_token")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (devicesError) {
    logServerError("push.expo.devices", devicesError, { userId });
    return 0;
  }

  const eligibleDevices = (devices ?? []).filter((device) =>
    isExpoPushToken(device.expo_push_token),
  );
  if (!eligibleDevices.length) return 0;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers,
      body: JSON.stringify(
        eligibleDevices.map((device) => ({
          to: device.expo_push_token,
          title,
          body,
          sound: "default",
          priority: "high",
          channelId: link === "/check-in" ? "reminders" : "community",
          data: { link },
        })),
      ),
    });

    if (!response.ok) {
      logPushEvent("expo_request_failed", { userId, statusCode: response.status });
      return 0;
    }

    const payload = (await response.json()) as { data?: ExpoPushTicket[] | ExpoPushTicket };
    const tickets = Array.isArray(payload.data) ? payload.data : payload.data ? [payload.data] : [];
    let accepted = 0;

    for (const [index, ticket] of tickets.entries()) {
      const device = eligibleDevices[index];
      if (!device) continue;
      if (ticket.status === "ok") {
        accepted += 1;
        continue;
      }

      if (ticket.details?.error === "DeviceNotRegistered") {
        await admin
          .from("mobile_push_devices")
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq("id", device.id);
      }
      logPushEvent("expo_ticket_error", {
        userId,
        deviceId: device.id,
        error: ticket.details?.error,
        message: ticket.message,
      });
    }

    return accepted;
  } catch (error) {
    logServerError("push.expo.send", error, { userId });
    return 0;
  }
}
