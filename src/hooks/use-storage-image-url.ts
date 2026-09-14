"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseStorageImageReference } from "@/lib/storage-image";

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const REFRESH_INTERVAL_MS = 50 * 60 * 1000;

type CachedUrl = { url: string; expiresAt: number };
type Resolution = { source: string; url: string | null };
const signedUrlCache = new Map<string, CachedUrl>();

function cachedUrl(source: string): string | null {
  const cached = signedUrlCache.get(source);
  return cached && cached.expiresAt > Date.now() + 60_000 ? cached.url : null;
}

export function useStorageImageUrl(source: string | null | undefined): string | null {
  const parsed = useMemo(() => parseStorageImageReference(source), [source]);
  const [resolution, setResolution] = useState<Resolution>(() => ({
    source: source ?? "",
    url: source && parsed ? cachedUrl(source) : source ?? null,
  }));

  useEffect(() => {
    if (!source || !parsed) return;
    const activeSource = source;
    const activeReference = parsed;

    let active = true;

    async function sign(force = false) {
      const current = force ? null : cachedUrl(activeSource);
      if (current) {
        if (active) setResolution({ source: activeSource, url: current });
        return;
      }

      try {
        const { data, error } = await createClient()
          .storage.from(activeReference.bucket)
          .createSignedUrl(activeReference.path, SIGNED_URL_TTL_SECONDS);

        if (!active) return;
        if (error || !data?.signedUrl) {
          setResolution({ source: activeSource, url: null });
          return;
        }

        signedUrlCache.set(activeSource, {
          url: data.signedUrl,
          expiresAt: Date.now() + SIGNED_URL_TTL_SECONDS * 1000,
        });
        setResolution({ source: activeSource, url: data.signedUrl });
      } catch {
        if (active) setResolution({ source: activeSource, url: null });
      }
    }

    void sign();
    const interval = window.setInterval(() => void sign(true), REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [parsed, source]);

  if (!source) return null;
  if (!parsed) return source;
  return resolution.source === source ? resolution.url : cachedUrl(source);
}
