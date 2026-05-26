"use client";

import { useRef, useTransition } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { uploadAvatar } from "@/actions/profile";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";

interface AvatarUploadProps {
  avatarUrl: string | null;
  name: string;
}

export function AvatarUpload({ avatarUrl, name }: AvatarUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Imagem deve ter no máximo 2MB.", "error");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if (result.success) {
        showToast("Foto de perfil atualizada!", "success");
      } else {
        showToast(result.error, "error");
      }
    });

    e.target.value = "";
  }

  return (
    <div className="relative inline-block">
      <Avatar src={avatarUrl} name={name} size="lg" />
      <div
        className={cn(
          "absolute -bottom-1 -right-1 flex gap-1",
          isPending && "opacity-50 pointer-events-none",
        )}
      >
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={isPending}
          className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md"
          aria-label="Tirar foto de perfil"
        >
          <Camera className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          disabled={isPending}
          className="h-8 w-8 rounded-full bg-surface border border-border text-foreground flex items-center justify-center shadow-md"
          aria-label="Escolher foto da galeria"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
