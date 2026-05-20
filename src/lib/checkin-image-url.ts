const HEIC_PATTERN = /\.hei[cf]$/i;

/** URLs exibíveis no feed (HEIC → JPEG via transformação do Supabase). */
export function getCheckinImageDisplayUrl(imageUrl: string): string {
  if (!HEIC_PATTERN.test(imageUrl)) {
    return imageUrl;
  }

  try {
    const url = new URL(imageUrl);
    const marker = "/storage/v1/object/public/checkins/";
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) {
      return imageUrl;
    }

    const objectPath = url.pathname.slice(idx + marker.length);
    return `${url.origin}/storage/v1/render/image/public/checkins/${objectPath}?format=origin`;
  } catch {
    return imageUrl;
  }
}
