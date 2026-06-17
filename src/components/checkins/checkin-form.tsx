"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCheckinForm } from "@/actions/checkins";
import {
  CHECKIN_IMAGE_MAX_BYTES,
  checkinImageSizeError,
} from "@/lib/checkin-image-limits";
import { buildGroupActivityOptions } from "@/lib/checkin-groups";
import { uploadCheckinImageFromClient } from "@/lib/upload-checkin-image";
import { isSportActivity } from "@/lib/sport-activities";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ImageUpload } from "@/components/checkins/image-upload";
import { GroupScopeSelector } from "@/components/checkins/group-scope-selector";
import { CheckinDatetimeFields } from "@/components/checkins/checkin-datetime-fields";
import { toDatetimeLocalValue } from "@/lib/checkin-datetime";
import { cn } from "@/lib/utils/cn";
import type { ActivityType, CheckinVisibility, GroupWithRole } from "@/types/database";
import { Lock, Globe } from "lucide-react";

interface CheckinFormProps {
  groups: GroupWithRole[];
  sourceGroupId: string;
  activities: ActivityType[];
  activitiesByGroupId: Record<string, ActivityType[]>;
}

export function CheckinForm({
  groups,
  sourceGroupId,
  activities,
  activitiesByGroupId,
}: CheckinFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    groups.map((group) => group.id),
  );
  const [visibility, setVisibility] = useState<CheckinVisibility>("public");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [durationValue, setDurationValue] = useState("");
  const [checkedInAt, setCheckedInAt] = useState(() => toDatetimeLocalValue(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"photo" | "details">("photo");
  const [isPending, startTransition] = useTransition();

  const activeActivities = activities.filter((activity) => activity.is_active);
  const showDistanceField =
    selectedActivity &&
    (isSportActivity(selectedActivity.name) || durationValue.length > 0);

  const unavailableByGroupId = useMemo(() => {
    if (!selectedActivity) return {};

    const options = buildGroupActivityOptions(groups, activitiesByGroupId, selectedActivity.name);
    return Object.fromEntries(
      options
        .filter((option) => option.unavailableReason)
        .map((option) => [option.group.id, option.unavailableReason]),
    );
  }, [activitiesByGroupId, groups, selectedActivity]);

  const effectiveSelectedGroupIds = selectedGroupIds.filter(
    (groupId) => !unavailableByGroupId[groupId],
  );

  function selectActivity(activity: ActivityType) {
    setSelectedActivity(activity);
    setVisibility(activity.is_private_default ? "private" : "public");

    const options = buildGroupActivityOptions(groups, activitiesByGroupId, activity.name);
    const availableGroupIds = options
      .filter((option) => option.activity)
      .map((option) => option.group.id);

    setSelectedGroupIds((current) => {
      const filtered = current.filter((groupId) => availableGroupIds.includes(groupId));
      return filtered.length > 0 ? filtered : availableGroupIds;
    });
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

    if (effectiveSelectedGroupIds.length === 0) {
      const msg = "Selecione ao menos um grupo disponível.";
      setError(msg);
      showToast(msg, "error");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("source_group_id", sourceGroupId);
    formData.set("activity_type_id", selectedActivity.id);
    formData.set("visibility", visibility);
    formData.set("checked_in_at", checkedInAt);
    formData.delete("group_ids");
    for (const groupId of effectiveSelectedGroupIds) {
      formData.append("group_ids", groupId);
    }

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

        const failureCount = result.data?.failures.length ?? 0;
        if (failureCount > 0) {
          showToast(
            `Check-in registrado em ${result.data?.checkinIds.length} grupo(s). ${failureCount} falhou(aram).`,
            "success",
          );
        } else {
          showToast("Check-in registrado com sucesso!", "success");
        }

        setTimeout(() => router.push("/home"), 1500);
      } else {
        setError(result.error);
        showToast(result.error, "error");
      }
    });
  }

  if (success) {
    return (
      <div className="animate-celebrate-pop">
        <Card className="text-center py-14 overflow-hidden relative">
          <div className="absolute inset-0 opacity-5 gradient-spiritual" />
          <p className="text-5xl mb-4 animate-celebrate-bounce">🙏</p>
          <h2 className="text-xl font-bold text-foreground">Check-in registrado!</h2>
          <p className="text-muted mt-2 text-sm">Sua constância está crescendo.</p>
        </Card>
      </div>
    );
  }

  if (step === "photo") {
    return (
      <div className="space-y-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted text-center">
          Passo 1 de 2 — Foto
        </p>
        <ImageUpload
          variant="first-step"
          preview={imagePreview}
          onSelect={handleSelectImage}
          onClear={handleClearImage}
        />
        {error && <p className="text-sm text-error text-center">{error}</p>}
        <Button type="button" fullWidth size="lg" onClick={() => setStep("details")}>
          {imagePreview ? "Continuar" : "Continuar sem foto"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Passo 2 de 2 — Detalhes
        </p>
        <button
          type="button"
          onClick={() => setStep("photo")}
          className="text-xs font-medium text-primary hover:underline"
        >
          {imagePreview ? "Alterar foto" : "Adicionar foto"}
        </button>
      </div>

      {imagePreview && (
        <div className="relative rounded-xl overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Foto do check-in"
            className="w-full h-36 object-cover"
          />
        </div>
      )}

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
          {groups.length > 1 && (
            <GroupScopeSelector
              groups={groups}
              selectedGroupIds={selectedGroupIds}
              onChange={setSelectedGroupIds}
              disabled={isPending}
              unavailableByGroupId={unavailableByGroupId}
            />
          )}

          <CheckinDatetimeFields
            value={checkedInAt}
            onChange={setCheckedInAt}
            disabled={isPending}
          />

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
          </div>

          {error && <p className="text-sm text-error text-center">{error}</p>}

          <Button type="submit" fullWidth size="lg" loading={isPending}>
            Confirmar check-in
            {effectiveSelectedGroupIds.length > 1
              ? ` em ${effectiveSelectedGroupIds.length} grupos`
              : ""}
          </Button>
        </>
      )}
    </form>
  );
}
