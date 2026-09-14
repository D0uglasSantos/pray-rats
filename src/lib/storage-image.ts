export const STORAGE_BUCKETS = ["avatars", "checkins"] as const;

export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

export type StorageImageReference = {
  bucket: StorageBucket;
  path: string;
};

function isStorageBucket(value: string): value is StorageBucket {
  return STORAGE_BUCKETS.includes(value as StorageBucket);
}

function normalizeObjectPath(path: string): string | null {
  const normalized = path.replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.split("/").some((segment) => !segment || segment === "." || segment === "..")
  ) {
    return null;
  }
  return normalized;
}

export function createStorageImageReference(bucket: StorageBucket, path: string): string {
  const normalized = normalizeObjectPath(path);
  if (!normalized) throw new Error("Caminho de imagem inválido.");
  return `storage://${bucket}/${normalized}`;
}

/** Aceita a referência privada atual e as URLs públicas legadas do Supabase. */
export function parseStorageImageReference(value: string | null | undefined): StorageImageReference | null {
  if (!value) return null;

  if (value.startsWith("storage://")) {
    try {
      const url = new URL(value);
      const bucket = url.hostname;
      const path = normalizeObjectPath(decodeURIComponent(url.pathname));
      return isStorageBucket(bucket) && path ? { bucket, path } : null;
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(value);
    const match = url.pathname.match(
      /\/storage\/v1\/(?:object\/public|render\/image\/public)\/(avatars|checkins)\/(.+)$/,
    );
    if (!match || !isStorageBucket(match[1])) return null;
    const path = normalizeObjectPath(decodeURIComponent(match[2]));
    return path ? { bucket: match[1], path } : null;
  } catch {
    return null;
  }
}

export function isOwnedStorageImageReference(
  value: string,
  bucket: StorageBucket,
  userId: string,
): boolean {
  const parsed = parseStorageImageReference(value);
  return parsed?.bucket === bucket && parsed.path.startsWith(`${userId}/`);
}
