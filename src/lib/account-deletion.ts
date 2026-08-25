import type { SupabaseClient } from "@supabase/supabase-js";

export const ACCOUNT_DELETION_CONFIRMATION = "EXCLUIR";
const STORAGE_BUCKETS = ["avatars", "checkins"] as const;
const STORAGE_PAGE_SIZE = 1000;

export function isAccountDeletionConfirmed(value: unknown): boolean {
  return typeof value === "string" && value.trim().toUpperCase() === ACCOUNT_DELETION_CONFIRMATION;
}

async function removeUserStorage(admin: SupabaseClient, bucket: string, userId: string) {
  while (true) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(userId, { limit: STORAGE_PAGE_SIZE, offset: 0 });
    if (error) throw error;

    const paths = (data ?? [])
      .filter((entry) => entry.name && entry.name !== ".emptyFolderPlaceholder")
      .map((entry) => `${userId}/${entry.name}`);
    if (!paths.length) return;

    const { error: removeError } = await admin.storage.from(bucket).remove(paths);
    if (removeError) throw removeError;
    if (paths.length < STORAGE_PAGE_SIZE) return;
  }
}

export async function permanentlyDeleteAccount(admin: SupabaseClient, userId: string) {
  for (const bucket of STORAGE_BUCKETS) {
    await removeUserStorage(admin, bucket, userId);
  }

  const { data: preparation, error: preparationError } = await admin.rpc(
    "prepare_account_deletion",
    { p_user_id: userId },
  );
  if (preparationError) throw preparationError;

  const { error: deletionError } = await admin.auth.admin.deleteUser(userId, false);
  if (deletionError) throw deletionError;

  return preparation as {
    transferred_groups?: number;
    deleted_empty_groups?: number;
  } | null;
}
