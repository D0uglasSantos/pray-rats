import type { SupabaseClient } from "@supabase/supabase-js";

export async function isUserGroupMember(
  supabase: SupabaseClient,
  groupId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
}
