import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;

export type UploadCheckinImageResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function uploadCheckinImageFromClient(
  file: File,
): Promise<UploadCheckinImageResult> {
  if (file.size === 0) {
    return { success: false, error: "Selecione uma imagem." };
  }

  if (file.size > MAX_BYTES) {
    return { success: false, error: "Imagem deve ter no máximo 5MB." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("checkins")
    .upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("checkins").getPublicUrl(path);

  return { success: true, url: publicUrl };
}
