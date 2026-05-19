"use client";

import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImageUploadProps {
  preview: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ImageUpload({
  preview,
  onSelect,
  onClear,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">Foto do momento (opcional)</p>
      <p className="text-xs text-muted mb-3">
        Registre uma foto para comprovar sua atividade — aparece no feed se público.
      </p>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Prévia da foto"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center"
            aria-label="Remover foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-2 p-8",
            "rounded-xl border-2 border-dashed border-border bg-surface-secondary",
            "text-muted hover:border-primary/40 hover:text-primary transition-colors",
            disabled && "opacity-50 pointer-events-none",
          )}
        >
          <Camera className="h-8 w-8" />
          <span className="text-sm font-medium">Tirar ou escolher foto</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
