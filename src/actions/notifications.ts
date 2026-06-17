"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapActionError } from "@/lib/errors/map-action-error";
import { logServerError } from "@/lib/monitoring";
import {
  isDeadPushSubscription,
  isPushConfigured,
  logPushEvent,
  sendPushWithRetry,
} from "@/lib/push-delivery";
import type { ActionResult } from "@/actions/auth";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export async function getNotifications(limit = 50): Promise<Notification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[notifications] getNotifications", error.message);
    }
    return [];
  }

  return (data as Notification[]) ?? [];
}

export const getUnreadCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
});

export async function markAsRead(notificationId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "notification" }),
    };
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function markAllAsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "notification" }),
    };
  }

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: true };
}

async function createNotificationForUser(
  userId: string,
  type: string,
  title: string,
  body: string,
  link: string,
): Promise<void> {
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[notifications] createNotificationForUser", error);
    }
    return;
  }

  const { error } = await admin.rpc("create_notification", {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_body: body,
    p_link: link,
  });

  if (error && process.env.NODE_ENV === "development") {
    console.error("[notifications] create_notification", error.message);
  }
}

type GroupNotificationPayload = {
  memberUserIds: string[];
  type: string;
  title: string;
  body: string;
  link: string;
};

async function fanOutGroupNotifications({
  memberUserIds,
  type,
  title,
  body,
  link,
}: GroupNotificationPayload): Promise<void> {
  for (const userId of memberUserIds) {
    await createNotificationForUser(userId, type, title, body, link);

    try {
      await sendPushToUser(userId, title, body, link);
    } catch {
      // Push is best-effort
    }
  }
}

function scheduleGroupNotifications(payload: GroupNotificationPayload): void {
  after(async () => {
    try {
      await fanOutGroupNotifications(payload);
    } catch (error) {
      logServerError("notifications.fanOut", error, {
        memberCount: payload.memberUserIds.length,
      });
    }
  });
}

export async function notifyGroupOfNewMember(
  groupId: string,
  memberId: string,
  memberName: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .neq("user_id", memberId);

  if (!members?.length) return;

  const groupName = group?.name ?? "seu grupo";
  scheduleGroupNotifications({
    memberUserIds: members.map((member) => member.user_id),
    type: "new_member",
    title: "Novo membro no grupo",
    body: `${memberName} entrou em ${groupName}`,
    link: "/group",
  });
}

export async function notifyGroupOfCheckin(
  groupId: string,
  authorId: string,
  authorName: string,
  checkinTitle: string,
  _checkinId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .neq("user_id", authorId);

  if (!members?.length) return;

  scheduleGroupNotifications({
    memberUserIds: members.map((member) => member.user_id),
    type: "new_checkin",
    title: "Novo check-in no grupo",
    body: `${authorName} registrou: ${checkinTitle}`,
    link: "/feed",
  });
}

async function sendPushToUser(
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

export async function getPushServerStatus(): Promise<{ configured: boolean }> {
  return { configured: isPushConfigured() };
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "notification" }),
    };
  }

  return { success: true };
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "notification" }),
    };
  }

  return { success: true };
}
