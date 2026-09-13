import { createAdminClient } from "@/lib/supabase/admin";
import { logServerError } from "@/lib/monitoring";
import { logPushEvent } from "@/lib/push-delivery";
import {
  chunkExpoItems,
  EXPO_PUSH_MESSAGE_BATCH_SIZE,
  EXPO_PUSH_SEND_URL,
  postExpoPushJson,
  type ExpoPushTicketPayload,
} from "@/lib/expo-push-api";

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
    .select("id, expo_push_token, project_id")
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

  const byProject = new Map<string, typeof eligibleDevices>();
  for (const device of eligibleDevices) {
    const projectDevices = byProject.get(device.project_id) ?? [];
    projectDevices.push(device);
    byProject.set(device.project_id, projectDevices);
  }

  let accepted = 0;
  const pendingTickets: {
    receipt_id: string;
    device_id: string;
    status: "pending";
    attempts: number;
    next_check_at: string;
  }[] = [];

  for (const [projectId, projectDevices] of byProject) {
    for (const devices of chunkExpoItems(projectDevices, EXPO_PUSH_MESSAGE_BATCH_SIZE)) {
      try {
        const payload = await postExpoPushJson<ExpoPushTicketPayload>(
          EXPO_PUSH_SEND_URL,
          devices.map((device) => ({
            to: device.expo_push_token,
            title,
            body,
            sound: "default",
            priority: "high",
            channelId: link === "/check-in" ? "reminders" : "community",
            data: { link },
          })),
        );
        if (payload.errors?.length) {
          logPushEvent("expo_payload_error", {
            userId,
            projectId,
            errors: payload.errors,
          });
        }
        const tickets = Array.isArray(payload.data)
          ? payload.data
          : payload.data
            ? [payload.data]
            : [];

        for (const [index, ticket] of tickets.entries()) {
          const device = devices[index];
          if (!device) continue;
          if (ticket.status === "ok" && ticket.id) {
            accepted += 1;
            pendingTickets.push({
              receipt_id: ticket.id,
              device_id: device.id,
              status: "pending",
              attempts: 0,
              next_check_at: new Date(Date.now() + 15 * 60_000).toISOString(),
            });
            continue;
          }

          if (ticket.status === "ok") {
            logPushEvent("expo_ticket_missing_receipt_id", {
              userId,
              deviceId: device.id,
              projectId,
            });
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
            projectId,
            error: ticket.details?.error,
            message: ticket.message,
          });
        }
      } catch (error) {
        logServerError("push.expo.batch", error, {
          userId,
          projectId,
          deviceCount: devices.length,
        });
      }
    }
  }

  if (pendingTickets.length) {
    const { error: ticketError } = await admin
      .from("expo_push_tickets")
      .upsert(pendingTickets, { onConflict: "receipt_id", ignoreDuplicates: true });
    if (ticketError) {
      logServerError("push.expo.persistTickets", ticketError, {
        userId,
        ticketCount: pendingTickets.length,
      });
    }
  }

  return accepted;
}
