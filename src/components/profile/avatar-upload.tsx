"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImageIcon } from "lucide-react";
import { updateAvatarUrl } from "@/actions/profile";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/ui/avatar";
import { uploadAvatarImageFromClient } from "@/lib/upload-avatar-image";
import { cn } from "@/lib/utils/cn";

interface AvatarUploadProps {
  avatarUrl: string | null;
  name: string;
}

export function AvatarUpload({ avatarUrl, name }: AvatarUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const router = useRouter();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      const uploadResult = await uploadAvatarImageFromClient(file);
      if (!uploadResult.success) {
        showToast(uploadResult.error, "error");
        return;
      }

      const updateResult = await updateAvatarUrl(uploadResult.url);
      if (!updateResult.success) {
        showToast(updateResult.error, "error");
        return;
      }

      setCurrentAvatarUrl(uploadResult.url);
      showToast("Foto de perfil atualizada!", "success");
      router.refresh();
    });

    e.target.value = "";
  }

  return (
    <div className="relative inline-block">
      <Avatar src={currentAvatarUrl} name={name} size="lg" />
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
