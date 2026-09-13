import { createAdminClient } from "@/lib/supabase/admin";
import {
  chunkExpoItems,
  EXPO_PUSH_RECEIPT_BATCH_SIZE,
  EXPO_PUSH_RECEIPTS_URL,
  postExpoPushJson,
  type ExpoPushReceiptPayload,
} from "@/lib/expo-push-api";
import { logServerError, logServerEvent } from "@/lib/monitoring";

export type PendingExpoPushTicket = {
  receipt_id: string;
  device_id: string;
  attempts: number;
  expires_at: string;
};

export type ExpoReceiptStats = {
  due: number;
  ok: number;
  errors: number;
  pending: number;
  expired: number;
  disabledDevices: number;
  requestErrors: number;
};

function nextCheckAt(attempts: number, now: Date) {
  const delayMinutes = Math.min(15 * 2 ** Math.max(attempts, 1), 120);
  return new Date(now.getTime() + delayMinutes * 60_000).toISOString();
}

type ReceiptUpdate = {
  receipt_id: string;
  device_id: string;
  status: "pending" | "ok" | "error" | "expired";
  attempts: number;
  next_check_at: string | null;
  checked_at: string | null;
  updated_at: string;
  error_code?: string | null;
  error_message?: string | null;
};

export function evaluateExpoReceiptBatch(
  tickets: PendingExpoPushTicket[],
  payload: ExpoPushReceiptPayload,
  now: Date,
) {
  const updates: ReceiptUpdate[] = [];
  const invalidDeviceIds = new Set<string>();
  const counters = { ok: 0, errors: 0, pending: 0, expired: 0 };

  for (const ticket of tickets) {
    const receipt = payload.data?.[ticket.receipt_id];
    const attempts = ticket.attempts + 1;
    const expired = new Date(ticket.expires_at).getTime() <= now.getTime() || attempts >= 6;

    if (!receipt) {
      updates.push({
        receipt_id: ticket.receipt_id,
        device_id: ticket.device_id,
        status: expired ? "expired" : "pending",
        attempts,
        next_check_at: expired ? null : nextCheckAt(attempts, now),
        checked_at: expired ? now.toISOString() : null,
        updated_at: now.toISOString(),
      });
      if (expired) counters.expired += 1;
      else counters.pending += 1;
      continue;
    }

    if (receipt.status === "ok") {
      counters.ok += 1;
    } else {
      counters.errors += 1;
      if (receipt.details?.error === "DeviceNotRegistered") {
        invalidDeviceIds.add(ticket.device_id);
      }
    }
    updates.push({
      receipt_id: ticket.receipt_id,
      device_id: ticket.device_id,
      status: receipt.status,
      attempts,
      next_check_at: null,
      checked_at: now.toISOString(),
      error_code: receipt.details?.error ?? null,
      error_message: receipt.message ?? null,
      updated_at: now.toISOString(),
    });
  }

  return { updates, invalidDeviceIds, counters };
}

export async function processExpoPushReceipts(): Promise<ExpoReceiptStats> {
  const stats: ExpoReceiptStats = {
    due: 0,
    ok: 0,
    errors: 0,
    pending: 0,
    expired: 0,
    disabledDevices: 0,
    requestErrors: 0,
  };
  const admin = createAdminClient();
  const now = new Date();

  const { data, error } = await admin
    .from("expo_push_tickets")
    .select("receipt_id,device_id,attempts,expires_at")
    .eq("status", "pending")
    .lte("next_check_at", now.toISOString())
    .order("next_check_at", { ascending: true })
    .limit(EXPO_PUSH_RECEIPT_BATCH_SIZE);
  if (error) throw error;

  const tickets = (data ?? []) as PendingExpoPushTicket[];
  stats.due = tickets.length;
  if (!tickets.length) return stats;

  for (const batch of chunkExpoItems(tickets, EXPO_PUSH_RECEIPT_BATCH_SIZE)) {
    let payload: ExpoPushReceiptPayload;
    try {
      payload = await postExpoPushJson<ExpoPushReceiptPayload>(
        EXPO_PUSH_RECEIPTS_URL,
        { ids: batch.map((ticket) => ticket.receipt_id) },
      );
    } catch (requestError) {
      stats.requestErrors += 1;
      logServerError("push.expo.receipts.request", requestError, { ticketCount: batch.length });
      const retryUpdates = batch.map((ticket) => {
        const attempts = ticket.attempts + 1;
        const expired = new Date(ticket.expires_at).getTime() <= now.getTime() || attempts >= 6;
        if (expired) stats.expired += 1;
        else stats.pending += 1;
        return {
          receipt_id: ticket.receipt_id,
          device_id: ticket.device_id,
          status: expired ? ("expired" as const) : ("pending" as const),
          attempts,
          next_check_at: expired ? null : nextCheckAt(attempts, now),
          checked_at: expired ? now.toISOString() : null,
          updated_at: now.toISOString(),
        };
      });
      const { error: retryError } = await admin
        .from("expo_push_tickets")
        .upsert(retryUpdates, { onConflict: "receipt_id" });
      if (retryError) logServerError("push.expo.receipts.scheduleRetry", retryError);
      continue;
    }

    const { updates, invalidDeviceIds, counters } = evaluateExpoReceiptBatch(batch, payload, now);
    stats.ok += counters.ok;
    stats.errors += counters.errors;
    stats.pending += counters.pending;
    stats.expired += counters.expired;

    for (const update of updates) {
      if (update.status === "error") {
        logServerEvent("push.expo.receipt", "error", {
          receiptId: update.receipt_id,
          deviceId: update.device_id,
          errorCode: update.error_code,
        });
      }
    }

    const { error: updateError } = await admin
      .from("expo_push_tickets")
      .upsert(updates, { onConflict: "receipt_id" });
    if (updateError) throw updateError;

    if (invalidDeviceIds.size) {
      const ids = [...invalidDeviceIds];
      const { error: disableError } = await admin
        .from("mobile_push_devices")
        .update({ enabled: false, updated_at: now.toISOString() })
        .in("id", ids);
      if (disableError) throw disableError;
      stats.disabledDevices += ids.length;
    }
  }

  const cleanupBefore = new Date(now.getTime() - 7 * 24 * 60 * 60_000).toISOString();
  const { error: cleanupError } = await admin
    .from("expo_push_tickets")
    .delete()
    .neq("status", "pending")
    .lt("checked_at", cleanupBefore);
  if (cleanupError) {
    logServerError("push.expo.receipts.cleanup", cleanupError);
  }

  logServerEvent("push.expo.receipts", "completed", stats);
  return stats;
}
