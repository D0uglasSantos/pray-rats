"use client";

import type { ImgHTMLAttributes } from "react";
import { useStorageImageUrl } from "@/hooks/use-storage-image-url";
import { cn } from "@/lib/utils/cn";

type StorageImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};

export function StorageImage({ src, alt = "", className, style, ...props }: StorageImageProps) {
  const resolvedUrl = useStorageImageUrl(src);
  if (!resolvedUrl) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block bg-surface-secondary", className)}
        style={style}
      />
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={resolvedUrl} alt={alt} className={className} style={style} {...props} />;
}
