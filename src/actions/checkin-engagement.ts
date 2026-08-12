"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { revalidateGroupDataCaches } from "@/lib/server-cache";
import { mapActionError } from "@/lib/errors/map-action-error";
import type { ActionResult } from "@/actions/auth";
import type { FeedComment, FeedReactionSummary } from "@/types/feed";

const MAX_REACTION_LENGTH = 16;
const MAX_COMMENT_LENGTH = 500;

export type CheckinEngagement = {
  reactions: FeedReactionSummary[];
  comments: FeedComment[];
  myReaction: string | null;
};

function revalidateEngagementPaths(groupIds: string[] = []) {
  revalidatePath("/feed");
  revalidatePath("/group");
  revalidateGroupDataCaches(groupIds);
}

function normalizeReaction(emoji: string): string | null {
  const trimmed = emoji.trim();
  if (!trimmed || trimmed.length > MAX_REACTION_LENGTH) return null;
  return trimmed;
}

async function getCheckinGroupId(
  checkinId: string,
): Promise<{ groupId: string; userId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("checkins")
    .select("group_id")
    .eq("id", checkinId)
    .maybeSingle();

  if (!data?.group_id) return null;
  return { groupId: data.group_id as string, userId: user.id };
}

function aggregateReactions(
  rows: { checkin_id: string; user_id: string; reaction: string }[],
  currentUserId: string | null,
): Map<string, { reactions: FeedReactionSummary[]; myReaction: string | null }> {
  const byCheckin = new Map<
    string,
    { counts: Map<string, number>; myReaction: string | null }
  >();

  for (const row of rows) {
    let entry = byCheckin.get(row.checkin_id);
    if (!entry) {
      entry = { counts: new Map(), myReaction: null };
      byCheckin.set(row.checkin_id, entry);
    }
    entry.counts.set(row.reaction, (entry.counts.get(row.reaction) ?? 0) + 1);
    if (currentUserId && row.user_id === currentUserId) {
      entry.myReaction = row.reaction;
    }
  }

  const result = new Map<
    string,
    { reactions: FeedReactionSummary[]; myReaction: string | null }
  >();

  for (const [checkinId, entry] of byCheckin) {
    const reactions = [...entry.counts.entries()]
      .map(([emoji, count]) => ({
        emoji,
        count,
        reactedByMe: entry.myReaction === emoji,
      }))
      .sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));

    result.set(checkinId, {
      reactions,
      myReaction: entry.myReaction,
    });
  }

  return result;
}

export async function getCheckinsEngagement(
  checkinIds: string[],
): Promise<Record<string, CheckinEngagement>> {
  const uniqueIds = [...new Set(checkinIds.filter(Boolean))];
  if (uniqueIds.length === 0) return {};

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: CheckinEngagement = {
    reactions: [],
    comments: [],
    myReaction: null,
  };
  const result: Record<string, CheckinEngagement> = Object.fromEntries(
    uniqueIds.map((id) => [id, { ...empty, reactions: [], comments: [] }]),
  );

  const [{ data: reactionRows }, { data: commentRows }] = await Promise.all([
    supabase
      .from("checkin_reactions")
      .select("checkin_id, user_id, reaction")
      .in("checkin_id", uniqueIds),
    supabase
      .from("checkin_comments")
      .select(
        "id, checkin_id, user_id, body, created_at, profile:profiles(name, avatar_url)",
      )
      .in("checkin_id", uniqueIds)
      .order("created_at", { ascending: true }),
  ]);

  const reactionMap = aggregateReactions(
    (reactionRows ?? []) as {
      checkin_id: string;
      user_id: string;
      reaction: string;
    }[],
    user?.id ?? null,
  );

  for (const [checkinId, value] of reactionMap) {
    result[checkinId] = {
      ...result[checkinId],
      reactions: value.reactions,
      myReaction: value.myReaction,
    };
  }

  for (const row of commentRows ?? []) {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const checkinId = row.checkin_id as string;
    if (!result[checkinId]) {
      result[checkinId] = { reactions: [], comments: [], myReaction: null };
    }
    result[checkinId].comments.push({
      id: row.id as string,
      checkin_id: checkinId,
      user_id: row.user_id as string,
      body: row.body as string,
      created_at: row.created_at as string,
      profile: (profile as FeedComment["profile"]) ?? null,
    });
  }

  return result;
}

export async function toggleCheckinReaction(
  checkinId: string,
  emoji: string,
): Promise<ActionResult<{ myReaction: string | null }>> {
  const reaction = normalizeReaction(emoji);
  if (!reaction) {
    return { success: false, error: "Emoji inválido." };
  }

  const context = await getCheckinGroupId(checkinId);
  if (!context) {
    return { success: false, error: "Faça login para reagir." };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("checkin_reactions")
    .select("id, reaction")
    .eq("checkin_id", checkinId)
    .eq("user_id", context.userId)
    .maybeSingle();

  if (existing?.reaction === reaction) {
    const { error } = await supabase
      .from("checkin_reactions")
      .delete()
      .eq("id", existing.id);
    if (error) {
      return {
        success: false,
        error: mapActionError(error, { context: "generic" }),
      };
    }
    revalidateEngagementPaths([context.groupId]);
    return { success: true, data: { myReaction: null } };
  }

  if (existing) {
    const { error } = await supabase
      .from("checkin_reactions")
      .update({ reaction })
      .eq("id", existing.id);
    if (error) {
      return {
        success: false,
        error: mapActionError(error, { context: "generic" }),
      };
    }
  } else {
    const { error } = await supabase.from("checkin_reactions").insert({
      checkin_id: checkinId,
      user_id: context.userId,
      reaction,
    });
    if (error) {
      return {
        success: false,
        error: mapActionError(error, { context: "generic" }),
      };
    }
  }

  revalidateEngagementPaths([context.groupId]);
  return { success: true, data: { myReaction: reaction } };
}

export async function addCheckinComment(
  checkinId: string,
  body: string,
): Promise<ActionResult<FeedComment>> {
  const trimmed = body.trim();
  if (!trimmed) {
    return { success: false, error: "Escreva um comentário." };
  }
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return {
      success: false,
      error: `Comentário deve ter no máximo ${MAX_COMMENT_LENGTH} caracteres.`,
    };
  }

  const context = await getCheckinGroupId(checkinId);
  if (!context) {
    return { success: false, error: "Faça login para comentar." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("checkin_comments")
    .insert({
      checkin_id: checkinId,
      user_id: context.userId,
      body: trimmed,
    })
    .select(
      "id, checkin_id, user_id, body, created_at, profile:profiles(name, avatar_url)",
    )
    .single();

  if (error || !data) {
    return {
      success: false,
      error: mapActionError(error, { context: "generic" }),
    };
  }

  const profile = Array.isArray(data.profile) ? data.profile[0] : data.profile;
  revalidateEngagementPaths([context.groupId]);

  return {
    success: true,
    data: {
      id: data.id as string,
      checkin_id: data.checkin_id as string,
      user_id: data.user_id as string,
      body: data.body as string,
      created_at: data.created_at as string,
      profile: (profile as FeedComment["profile"]) ?? null,
    },
  };
}

export async function deleteCheckinComment(
  commentId: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const { data: comment } = await supabase
    .from("checkin_comments")
    .select("id, user_id, checkin_id, checkin:checkins(group_id)")
    .eq("id", commentId)
    .maybeSingle();

  if (!comment || comment.user_id !== user.id) {
    return { success: false, error: "Comentário não encontrado." };
  }

  const { error } = await supabase
    .from("checkin_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      error: mapActionError(error, { context: "generic" }),
    };
  }

  const checkin = Array.isArray(comment.checkin)
    ? comment.checkin[0]
    : comment.checkin;
  const groupId = (checkin as { group_id?: string } | null)?.group_id;
  revalidateEngagementPaths(groupId ? [groupId] : []);

  return { success: true };
}
