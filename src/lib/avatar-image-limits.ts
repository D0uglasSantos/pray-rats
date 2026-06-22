/** Limite após compressão (upload direto ao Supabase, fora do servidor Next). */
export const AVATAR_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export const AVATAR_IMAGE_MAX_SIZE_LABEL = "2MB";

export function avatarImageSizeError(): string {
  return `Imagem deve ter no máximo ${AVATAR_IMAGE_MAX_SIZE_LABEL} após compressão.`;
}
