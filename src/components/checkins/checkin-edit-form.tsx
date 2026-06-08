"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCheckinForm, updateCheckinForm } from "@/actions/checkins";
import {
  CHECKIN_IMAGE_MAX_BYTES,
  checkinImageSizeError,
} from "@/lib/checkin-image-limits";
import { buildGroupActivityOptions } from "@/lib/checkin-groups";
import { getCheckinImageDisplayUrl } from "@/lib/checkin-image-url";
import { uploadCheckinImageFromClient } from "@/lib/upload-checkin-image";
import { isSportActivity } from "@/lib/sport-activities";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GroupScopeSelector } from "@/components/checkins/group-scope-selector";
import { CheckinDatetimeFields } from "@/components/checkins/checkin-datetime-fields";
import { toDatetimeLocalValue } from "@/lib/checkin-datetime";
import { ImageUpload } from "@/components/checkins/image-upload";
import { cn } from "@/lib/utils/cn";
import type {
  ActivityType,
  CheckinEditContext,
  CheckinVisibility,
  GroupWithRole,
} from "@/types/database";
import { ChevronLeft, Globe, Lock, Trash2 } from "lucide-react";

interface CheckinEditFormProps {
  context: CheckinEditContext;
  groups: GroupWithRole[];
}

function getActivityName(context: CheckinEditContext): string {
  const activityType = context.checkin.activity_type;
  if (!activityType) return "";
  if (Array.isArray(activityType)) return activityType[0]?.name ?? "";
  return activityType.name;
}

export function CheckinEditForm({ context, groups }: CheckinEditFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const initialActivityName = getActivityName(context);
  const sourceGroupId = context.checkin.group_id;
  const sourceActivities = context.activitiesByGroupId[sourceGroupId] ?? [];

  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(
    sourceActivities.find((activity) => activity.name === initialActivityName) ??
      sourceActivities[0] ??
      null,
  );
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    context.batchEntries.map((entry) => entry.group_id),
  );
  const [visibility, setVisibility] = useState<CheckinVisibility>(context.checkin.visibility);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    context.checkin.image_url ? getCheckinImageDisplayUrl(context.checkin.image_url) : null,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(context.checkin.image_url);
  const [durationValue, setDurationValue] = useState(
    context.checkin.duration_minutes ? String(context.checkin.duration_minutes) : "",
  );
  const [title, setTitle] = useState(context.checkin.title);
  const [description, setDescription] = useState(context.checkin.description ?? "");
  const [checkedInAt, setCheckedInAt] = useState(() =>
    toDatetimeLocalValue(new Date(context.checkin.checked_in_at)),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  const scopedGroups = groups.filter((group) =>
    context.batchEntries.some((entry) => entry.group_id === group.id),
  );

  const activeActivities = sourceActivities.filter((activity) => activity.is_active);
  const showDistanceField =
    selectedActivity &&
    (isSportActivity(selectedActivity.name) || durationValue.length > 0);

  const unavailableByGroupId = useMemo(() => {
    if (!selectedActivity) return {};

    const options = buildGroupActivityOptions(
      scopedGroups,
      context.activitiesByGroupId,
      selectedActivity.name,
    );

    return Object.fromEntries(
      options
        .filter((option) => option.unavailableReason)
        .map((option) => [option.group.id, option.unavailableReason]),
    );
  }, [context.activitiesByGroupId, scopedGroups, selectedActivity]);

  const effectiveSelectedGroupIds = selectedGroupIds.filter(
    (groupId) => !unavailableByGroupId[groupId],
  );

  function selectActivity(activity: ActivityType) {
    setSelectedActivity(activity);
    const options = buildGroupActivityOptions(
      scopedGroups,
      context.activitiesByGroupId,
      activity.name,
    );
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
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageUrl(null);
  }

  async function buildFormData(): Promise<FormData | null> {
    if (!selectedActivity) {
      const msg = "Selecione uma atividade.";
      setError(msg);
      showToast(msg, "error");
      return null;
    }

    if (effectiveSelectedGroupIds.length === 0) {
      const msg = "Selecione ao menos um grupo disponível.";
      setError(msg);
      showToast(msg, "error");
      return null;
    }

    const formData = new FormData();
    formData.set("checkin_id", context.checkin.id);
    formData.set("source_group_id", sourceGroupId);
    formData.set("activity_type_id", selectedActivity.id);
    formData.set("title", title);
    formData.set("description", description);
    formData.set("visibility", visibility);
    formData.set("checked_in_at", checkedInAt);
    if (durationValue) formData.set("duration_minutes", durationValue);

    const distanceInput = document.querySelector<HTMLInputElement>('input[name="distance_km"]');
    if (distanceInput?.value) {
      formData.set("distance_km", distanceInput.value);
    } else if (context.checkin.distance_km) {
      formData.set("distance_km", String(context.checkin.distance_km));
    }

    for (const groupId of effectiveSelectedGroupIds) {
      formData.append("group_ids", groupId);
    }

    if (imageFile) {
      const uploadResult = await uploadCheckinImageFromClient(imageFile);
      if (!uploadResult.success) {
        setError(uploadResult.error);
        showToast(uploadResult.error, "error");
        return null;
      }
      formData.set("image_url", uploadResult.url);
    } else if (imageUrl) {
      formData.set("image_url", imageUrl);
    }

    return formData;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    startTransition(async () => {
      setError(null);
      const formData = await buildFormData();
      if (!formData) return;

      const result = await updateCheckinForm(formData);
      if (result.success) {
        const failureCount = result.data?.failures.length ?? 0;
        showToast(
          failureCount > 0
            ? `Check-in atualizado em ${result.data?.checkinIds.length} grupo(s). ${failureCount} falhou(aram).`
            : "Check-in atualizado com sucesso!",
          "success",
        );
        router.push("/home");
        router.refresh();
      } else {
        setError(result.error);
        showToast(result.error, "error");
      }
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      effectiveSelectedGroupIds.length > 1
        ? `Excluir este check-in de ${effectiveSelectedGroupIds.length} grupos selecionados?`
        : "Excluir este check-in?",
    );
    if (!confirmed) return;

    startDeleteTransition(async () => {
      const formData = new FormData();
      formData.set("checkin_id", context.checkin.id);
      for (const groupId of effectiveSelectedGroupIds) {
        formData.append("group_ids", groupId);
      }

      const result = await deleteCheckinForm(formData);
      if (result.success) {
        showToast("Check-in excluído.", "success");
        router.push("/home");
        router.refresh();
      } else {
        showToast(result.error, "error");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Link>

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

        {scopedGroups.length > 1 && (
          <GroupScopeSelector
            groups={scopedGroups}
            selectedGroupIds={selectedGroupIds}
            onChange={setSelectedGroupIds}
            disabled={isPending || isDeleting}
            unavailableByGroupId={unavailableByGroupId}
          />
        )}

        <CheckinDatetimeFields
          value={checkedInAt}
          onChange={setCheckedInAt}
          disabled={isPending || isDeleting}
        />

        <Input
          name="title"
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={140}
        />

        <Textarea
          name="description"
          label="Reflexão (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />

        <Input
          name="duration_minutes"
          type="number"
          label="Duração em minutos (opcional)"
          min={1}
          value={durationValue}
          onChange={(e) => setDurationValue(e.target.value)}
        />

        {showDistanceField && (
          <Input
            name="distance_km"
            type="number"
            label="Distância em km (opcional)"
            defaultValue={context.checkin.distance_km ?? undefined}
            min={0.1}
            step={0.1}
          />
        )}

        <ImageUpload
          preview={imagePreview}
          onSelect={handleSelectImage}
          onClear={handleClearImage}
          disabled={isPending || isDeleting}
        />

        <div>
          <p className="text-sm font-medium mb-2">Visibilidade</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibility("public")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                visibility === "public" ? "border-primary bg-primary/5" : "border-border",
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
                visibility === "private" ? "border-primary bg-primary/5" : "border-border",
              )}
            >
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Privado</span>
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-error text-center">{error}</p>}

        <Button type="submit" fullWidth size="lg" loading={isPending}>
          Salvar alterações
          {effectiveSelectedGroupIds.length > 1
            ? ` em ${effectiveSelectedGroupIds.length} grupos`
            : ""}
        </Button>
      </form>

      <Button
        variant="secondary"
        fullWidth
        loading={isDeleting}
        onClick={handleDelete}
        className="text-error border-error/30"
      >
        <Trash2 className="h-4 w-4" />
        Excluir check-in
        {effectiveSelectedGroupIds.length > 1
          ? ` de ${effectiveSelectedGroupIds.length} grupos`
          : ""}
      </Button>
    </div>
  );
}
