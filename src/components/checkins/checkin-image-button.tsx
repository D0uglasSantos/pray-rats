"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/checkins/image-lightbox";
import { cn } from "@/lib/utils/cn";
import { useStorageImageUrl } from "@/hooks/use-storage-image-url";

interface CheckinImageButtonProps {
  src: string;
  alt?: string;
  className?: string;
  compact?: boolean;
}

export function CheckinImageButton({
  src,
  alt = "Foto do check-in",
  className,
  compact = false,
}: CheckinImageButtonProps) {
  const [open, setOpen] = useState(false);
  const resolvedSrc = useStorageImageUrl(src);

  if (!resolvedSrc) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "cursor-zoom-in overflow-hidden",
          compact ? "shrink-0" : "block w-full rounded-xl",
        )}
        aria-label="Ver foto em tela cheia"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedSrc}
          alt={alt}
          className={cn(
            compact ? "h-14 w-14 rounded-lg object-cover" : "w-full h-48 object-cover",
            className,
          )}
        />
      </button>
      {open && <ImageLightbox src={resolvedSrc} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
