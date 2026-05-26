"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapActionError } from "@/lib/errors/map-action-error";
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

export async function getUnreadCount(): Promise<number> {
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
}

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

export async function notifyGroupOfCheckin(
  groupId: string,
  authorId: string,
  authorName: string,
  checkinTitle: string,
  checkinId: string,
): Promise<void> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .neq("user_id", authorId);

  if (!members?.length) return;

  const title = "Novo check-in no grupo";
  const body = `${authorName} registrou: ${checkinTitle}`;
  const link = "/feed";

  for (const member of members) {
    const { error } = await supabase.rpc("create_notification", {
      p_user_id: member.user_id,
      p_type: "new_checkin",
      p_title: title,
      p_body: body,
      p_link: link,
    });

    if (error && process.env.NODE_ENV === "development") {
      console.error("[notifications] create_notification", error.message);
    }

    try {
      await sendPushToUser(member.user_id, title, body, link);
    } catch {
      // Push is best-effort
    }
  }
}

async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  link: string,
): Promise<void> {
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!privateKey || !publicKey || !subject) return;

  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subscriptions?.length) return;

  const webpush = await import("web-push");
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const payload = JSON.stringify({ title, body, link });

  await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
      ),
    ),
  );
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
