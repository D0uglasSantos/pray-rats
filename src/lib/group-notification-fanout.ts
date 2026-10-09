import "server-only";

import { after } from "next/server";
import { logServerError } from "@/lib/monitoring";
import { sendExpoPushToUser } from "@/lib/send-expo-push-to-user";
import { sendPushToUser } from "@/lib/send-push-to-user";
import { createAdminClient } from "@/lib/supabase/admin";

export type GroupNotificationPayload = {
  memberUserIds: string[];
  type: string;
  title: string;
  body: string;
  link: string;
};

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
    logServerError("notifications.create.config", error, { userId });
    return;
  }

  const { error } = await admin.rpc("create_notification", {
    p_user_id: userId,
    p_type: type,
    p_title: title,
    p_body: body,
    p_link: link,
  });

  if (error) {
    logServerError("notifications.create", error, { userId, type });
  }
}

async function fanOutGroupNotifications({
  memberUserIds,
  type,
  title,
  body,
  link,
}: GroupNotificationPayload): Promise<void> {
  for (const userId of memberUserIds) {
    await createNotificationForUser(userId, type, title, body, link);

    await Promise.allSettled([
      sendPushToUser(userId, title, body, link),
      sendExpoPushToUser(userId, title, body, link),
    ]);
  }
}

export function scheduleGroupNotifications(payload: GroupNotificationPayload): void {
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

export async function notifyGroupOfCheckinFromTrustedServer(
  groupId: string,
  authorId: string,
  authorName: string,
  checkinTitle: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data: members, error } = await admin
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .neq("user_id", authorId);

  if (error) throw error;
  if (!members?.length) return;

  scheduleGroupNotifications({
    memberUserIds: members.map((member) => member.user_id),
    type: "new_checkin",
    title: "Novo check-in no grupo",
    body: `${authorName} registrou: ${checkinTitle}`,
    link: "/feed",
  });
}
