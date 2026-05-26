"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCheckinForm } from "@/actions/checkins";
import {
  CHECKIN_IMAGE_MAX_BYTES,
  checkinImageSizeError,
} from "@/lib/checkin-image-limits";
import { uploadCheckinImageFromClient } from "@/lib/upload-checkin-image";
import { isSportActivity } from "@/lib/sport-activities";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/checkins/image-upload";
import { cn } from "@/lib/utils/cn";
import type { ActivityType, CheckinVisibility } from "@/types/database";
import { Lock, Globe } from "lucide-react";

interface CheckinFormProps {
  groupId: string;
  activities: ActivityType[];
}

export function CheckinForm({ groupId, activities }: CheckinFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(
    null,
  );
  const [visibility, setVisibility] = useState<CheckinVisibility>("public");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [durationValue, setDurationValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const activeActivities = activities.filter((a) => a.is_active);
  const showDistanceField =
    selectedActivity &&
    (isSportActivity(selectedActivity.name) || durationValue.length > 0);

  function selectActivity(activity: ActivityType) {
    setSelectedActivity(activity);
    setVisibility(activity.is_private_default ? "private" : "public");
  }

  function handleSelectImage(file: File) {
    if (file.size > CHECKIN_IMAGE_MAX_BYTES) {
      const msg = checkinImageSizeError();
      setError(msg);
      showToast(msg, "error");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleClearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedActivity) {
      const msg = "Selecione uma atividade.";
      setError(msg);
      showToast(msg, "error");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("group_id", groupId);
    formData.set("activity_type_id", selectedActivity.id);
    formData.set("visibility", visibility);

    startTransition(async () => {
      setError(null);

      if (imageFile) {
        const uploadResult = await uploadCheckinImageFromClient(imageFile);
        if (!uploadResult.success) {
          setError(uploadResult.error);
          showToast(uploadResult.error, "error");
          return;
        }
        formData.set("image_url", uploadResult.url);
      }

      const result = await createCheckinForm(formData);
      if (result.success) {
        handleClearImage();
        setSuccess(true);
        showToast("Check-in registrado com sucesso!", "success");
        setTimeout(() => router.push("/"), 1500);
      } else {
        setError(result.error);
        showToast(result.error, "error");
      }
    });
  }

  if (success) {
    return (
      <Card className="text-center py-12">
        <p className="text-4xl mb-3">🙏</p>
        <h2 className="text-xl font-bold text-foreground">Check-in registrado!</h2>
        <p className="text-muted mt-1">Sua constância está crescendo.</p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3">Tipo de atividade</p>
        <div className="grid grid-cols-2 gap-2">
          {activeActivities.map((activity) => (
            <button
              key={activity.id}
              type="button"
              onClick={() => selectActivity(activity)}
              className={cn(
                "p-3 rounded-xl border text-left transition-all active:scale-[0.98]",
                selectedActivity?.id === activity.id
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border bg-surface hover:border-primary/30",
              )}
            >
              <p className="font-medium text-sm">{activity.name}</p>
              <p className="text-xs text-muted mt-0.5">{activity.points} pts</p>
            </button>
          ))}
        </div>
      </div>

      {selectedActivity && (
        <>
          <Input
            name="title"
            label="Título"
            placeholder="Ex: Oração da manhã"
            required
            maxLength={140}
          />

          <Textarea
            name="description"
            label="Reflexão (opcional)"
            placeholder="Como foi esse momento?"
            maxLength={500}
          />

          <Input
            name="duration_minutes"
            type="number"
            label="Duração em minutos (opcional)"
            placeholder="15"
            min={1}
            value={durationValue}
            onChange={(e) => setDurationValue(e.target.value)}
          />

          {showDistanceField && (
            <Input
              name="distance_km"
              type="number"
              label="Distância em km (opcional)"
              placeholder="5.2"
              min={0.1}
              step={0.1}
            />
          )}

          <ImageUpload
            preview={imagePreview}
            onSelect={handleSelectImage}
            onClear={handleClearImage}
            disabled={isPending}
          />

          <div>
            <p className="text-sm font-medium mb-2">Visibilidade</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVisibility("public")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                  visibility === "public"
                    ? "border-primary bg-primary/5"
                    : "border-border",
                )}
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Público</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                  visibility === "private"
                    ? "border-primary bg-primary/5"
                    : "border-border",
                )}
              >
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Privado</span>
              </button>
            </div>
            {visibility === "public" && imagePreview && (
              <p className="text-xs text-muted mt-2">
                Fotos em check-ins públicos aparecem no feed do grupo.
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}

          <Button type="submit" fullWidth size="lg" loading={isPending}>
            Confirmar check-in
          </Button>
        </>
      )}
    </form>
  );
}
