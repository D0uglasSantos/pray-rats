import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isOwnedStorageImageReference,
  parseStorageImageReference,
} from "@/lib/storage-image";

/** Remove o objeto somente quando nenhum check-in do autor ainda o referencia. */
export async function removeUnreferencedCheckinImage(
  supabase: SupabaseClient,
  userId: string,
  imageReference: string | null | undefined,
): Promise<void> {
  if (
    !imageReference ||
    !isOwnedStorageImageReference(imageReference, "checkins", userId)
  ) {
    return;
  }

  const parsed = parseStorageImageReference(imageReference);
  if (!parsed) return;

  const { data: canRemove, error } = await supabase.rpc(
    "can_remove_unreferenced_checkin_image",
    { object_name: parsed.path },
  );

  if (error || canRemove !== true) return;
  await supabase.storage.from("checkins").remove([parsed.path]);
}
