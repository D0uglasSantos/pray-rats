/** Limite por foto de check-in (upload direto ao Supabase, fora do servidor Next). */
export const CHECKIN_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const CHECKIN_IMAGE_MAX_SIZE_LABEL = "10MB";

export function checkinImageSizeError(): string {
  return `Imagem deve ter no máximo ${CHECKIN_IMAGE_MAX_SIZE_LABEL}.`;
}
