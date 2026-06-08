"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapActionError } from "@/lib/errors/map-action-error";
import type { ActionResult } from "@/actions/auth";
import type { Profile } from "@/types/database";

export interface FollowStatus {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isFriend: boolean;
}

export interface FollowUser extends Pick<Profile, "id" | "name" | "avatar_url" | "bio"> {
  followed_at: string;
}

export async function getFollowStatus(targetUserId: string): Promise<FollowStatus> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id === targetUserId) {
    return { isFollowing: false, isFollowedBy: false, isFriend: false };
  }

  const { data } = await supabase
    .from("user_follows")
    .select("follower_id, following_id")
    .or(
      `and(follower_id.eq.${user.id},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${user.id})`,
    );

  const isFollowing = (data ?? []).some(
    (row) => row.follower_id === user.id && row.following_id === targetUserId,
  );
  const isFollowedBy = (data ?? []).some(
    (row) => row.follower_id === targetUserId && row.following_id === user.id,
  );

  return {
    isFollowing,
    isFollowedBy,
    isFriend: isFollowing && isFollowedBy,
  };
}

export async function followUser(targetUserId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  if (user.id === targetUserId) {
    return { success: false, error: "Você não pode seguir a si mesmo." };
  }

  const { error } = await supabase.from("user_follows").insert({
    follower_id: user.id,
    following_id: targetUserId,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: true };
    }
    return { success: false, error: mapActionError(error, { context: "profile" }) };
  }

  revalidatePath("/profile");
  revalidatePath(`/group/member/${targetUserId}`);
  return { success: true };
}

export async function unfollowUser(targetUserId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);

  if (error) {
    return { success: false, error: mapActionError(error, { context: "profile" }) };
  }

  revalidatePath("/profile");
  revalidatePath(`/group/member/${targetUserId}`);
  return { success: true };
}

export async function getFollowCounts(userId: string) {
  const supabase = await createClient();

  const [followersResult, followingResult, followingRows] = await Promise.all([
    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", userId),
    supabase.from("user_follows").select("following_id").eq("follower_id", userId),
  ]);

  const followingIds = (followingRows.data ?? []).map((row) => row.following_id);
  let friendsCount = 0;

  if (followingIds.length > 0) {
    const { count } = await supabase
      .from("user_follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", userId)
      .in("follower_id", followingIds);
    friendsCount = count ?? 0;
  }

  return {
    followers: followersResult.count ?? 0,
    following: followingResult.count ?? 0,
    friends: friendsCount,
  };
}

async function mapFollowRows(
  rows: { created_at: string; profile: Profile | Profile[] | null }[],
): Promise<FollowUser[]> {
  return rows
    .map((row) => {
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
      if (!profile) return null;
      return {
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        followed_at: row.created_at,
      };
    })
    .filter((row): row is FollowUser => row !== null);
}

export async function getFollowers(userId: string): Promise<FollowUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_follows")
    .select("created_at, profile:profiles!user_follows_follower_id_fkey(id, name, avatar_url, bio)")
    .eq("following_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return mapFollowRows((data ?? []) as { created_at: string; profile: Profile | Profile[] | null }[]);
}

export async function getFollowing(userId: string): Promise<FollowUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("user_follows")
    .select("created_at, profile:profiles!user_follows_following_id_fkey(id, name, avatar_url, bio)")
    .eq("follower_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return mapFollowRows((data ?? []) as { created_at: string; profile: Profile | Profile[] | null }[]);
}

export async function getFriends(userId: string): Promise<FollowUser[]> {
  const following = await getFollowing(userId);
  if (following.length === 0) return [];

  const supabase = await createClient();
  const followingIds = following.map((user) => user.id);

  const { data, error } = await supabase
    .from("user_follows")
    .select("created_at, profile:profiles!user_follows_follower_id_fkey(id, name, avatar_url, bio)")
    .eq("following_id", userId)
    .in("follower_id", followingIds)
    .order("created_at", { ascending: false });

  if (error) return [];
  return mapFollowRows((data ?? []) as { created_at: string; profile: Profile | Profile[] | null }[]);
}

export async function canViewProfile(viewerId: string, targetUserId: string): Promise<boolean> {
  if (viewerId === targetUserId) return true;

  const supabase = await createClient();

  const { data: viewerGroups } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", viewerId);

  const groupIds = (viewerGroups ?? []).map((row) => row.group_id);
  if (groupIds.length > 0) {
    const { data: targetMember } = await supabase
      .from("group_members")
      .select("id")
      .eq("user_id", targetUserId)
      .in("group_id", groupIds)
      .limit(1)
      .maybeSingle();

    if (targetMember) return true;
  }

  const status = await getFollowStatus(targetUserId);
  return status.isFollowing || status.isFollowedBy;
}
