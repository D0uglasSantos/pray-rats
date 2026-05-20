import {
  CHECKIN_IMAGE_MAX_BYTES,
  checkinImageSizeError,
} from "@/lib/checkin-image-limits";
import { prepareCheckinImageForUpload } from "@/lib/prepare-checkin-image";
import { createClient } from "@/lib/supabase/client";

export type UploadCheckinImageResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function uploadCheckinImageFromClient(
  file: File,
): Promise<UploadCheckinImageResult> {
  if (file.size === 0) {
    return { success: false, error: "Selecione uma imagem." };
  }

  let prepared: File;
  try {
    prepared = await prepareCheckinImageForUpload(file);
  } catch {
    return {
      success: false,
      error: "Não foi possível processar a imagem. Tente outra foto.",
    };
  }

  if (prepared.size > CHECKIN_IMAGE_MAX_BYTES) {
    return { success: false, error: checkinImageSizeError() };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const ext = prepared.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("checkins")
    .upload(path, prepared, {
      upsert: false,
      contentType: prepared.type || "image/jpeg",
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("checkins").getPublicUrl(path);

  return { success: true, url: publicUrl };
}
