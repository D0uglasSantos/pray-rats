import {
  AVATAR_IMAGE_MAX_BYTES,
  avatarImageSizeError,
} from "@/lib/avatar-image-limits";
import { mapActionError } from "@/lib/errors/map-action-error";
import { prepareImageForUpload } from "@/lib/prepare-checkin-image";
import { createClient } from "@/lib/supabase/client";

const AVATAR_MAX_DIMENSION = 512;
const AVATAR_JPEG_QUALITY = 0.82;

export type UploadAvatarImageResult =
  | { success: true; url: string }
  | { success: false; error: string };

export async function uploadAvatarImageFromClient(
  file: File,
): Promise<UploadAvatarImageResult> {
  if (file.size === 0) {
    return { success: false, error: "Selecione uma imagem." };
  }

  let prepared: File;
  try {
    prepared = await prepareImageForUpload(file, {
      maxDimension: AVATAR_MAX_DIMENSION,
      quality: AVATAR_JPEG_QUALITY,
      forceOptimize: true,
    });
  } catch {
    return {
      success: false,
      error: "Não foi possível processar a imagem. Tente outra foto.",
    };
  }

  if (prepared.size > AVATAR_IMAGE_MAX_BYTES) {
    return { success: false, error: avatarImageSizeError() };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Faça login para continuar." };
  }

  const path = `${user.id}/avatar.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, prepared, {
      upsert: true,
      contentType: "image/jpeg",
    });

  if (uploadError) {
    return {
      success: false,
      error: mapActionError(uploadError, { context: "upload" }),
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return { success: true, url: `${publicUrl}?t=${Date.now()}` };
}
