"use client";

import { useRef } from "react";
import { Camera, ImageIcon, X } from "lucide-react";
import { CHECKIN_IMAGE_MAX_SIZE_LABEL } from "@/lib/checkin-image-limits";
import { cn } from "@/lib/utils/cn";

interface ImageUploadProps {
  preview: string | null;
  onSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  /** Textos para o passo inicial do check-in (foto primeiro). */
  variant?: "default" | "first-step";
}

export function ImageUpload({
  preview,
  onSelect,
  onClear,
  disabled,
  variant = "default",
}: ImageUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
  }

  const isFirstStep = variant === "first-step";

  return (
    <div>
      <p className="text-sm font-medium mb-2">
        {isFirstStep ? "Foto do momento" : "Foto do momento (opcional)"}
      </p>
      <p className="text-xs text-muted mb-3">
        {isFirstStep
          ? "Comece tirando uma foto ou escolhendo da galeria. Depois preencha os detalhes do check-in."
          : `Tire uma foto ou escolha da galeria — aparece no feed se público. Máximo de ${CHECKIN_IMAGE_MAX_SIZE_LABEL} por imagem.`}
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
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6",
              "rounded-xl border-2 border-dashed border-border bg-surface-secondary",
              "text-muted hover:border-primary/40 hover:text-primary transition-colors",
              disabled && "opacity-50 pointer-events-none",
            )}
          >
            <Camera className="h-7 w-7" />
            <span className="text-sm font-medium">Tirar foto</span>
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-6",
              "rounded-xl border-2 border-dashed border-border bg-surface-secondary",
              "text-muted hover:border-primary/40 hover:text-primary transition-colors",
              disabled && "opacity-50 pointer-events-none",
            )}
          >
            <ImageIcon className="h-7 w-7" />
            <span className="text-sm font-medium">Galeria</span>
          </button>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
