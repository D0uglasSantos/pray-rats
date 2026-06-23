"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  createActivityType,
  deleteActivityType,
  updateActivityType,
} from "@/actions/groups";
import { ActivityForm } from "@/components/groups/activities/activity-form";
import {
  ActivityDrawer,
  ActivityDrawerFooter,
} from "@/components/groups/activities/activity-drawer";
import { ActivityCompactCard } from "@/components/groups/activities/activity-compact-card";
import { ActivityFilters } from "@/components/groups/activities/activity-filters";
import { DeleteActivityDialog } from "@/components/groups/activities/delete-activity-dialog";
import { ActivitiesEmptyState } from "@/components/groups/activities/activities-empty-state";
import { ActivityListPagination } from "@/components/groups/activities/activity-list-pagination";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  activityTypeToFormValues,
  ACTIVITY_LIST_PAGE_SIZE,
  createDefaultFormValues,
  matchesActivityFilter,
  paginateItems,
  validateActivityFormValues,
  type ActivityFilter,
  type ActivityFormValues,
} from "@/lib/activity-display";
import type { ActivityType } from "@/types/database";

interface GroupActivitiesSectionProps {
  groupId: string;
  activities: ActivityType[];
}

type DrawerMode = "create" | "edit" | null;

export function GroupActivitiesSection({
  groupId,
  activities,
}: GroupActivitiesSectionProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [page, setPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [formValues, setFormValues] = useState<ActivityFormValues>(createDefaultFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivityType | null>(null);

  const activeCount = activities.filter((activity) => activity.is_active).length;

  const filteredActivities = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...activities]
      .filter((activity) => matchesActivityFilter(activity, filter))
      .filter((activity) => {
        if (!query) return true;
        return (
          activity.name.toLowerCase().includes(query) ||
          (activity.description ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return a.name.localeCompare(b.name, "pt-BR");
      });
  }, [activities, filter, search]);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const pagination = useMemo(
    () => paginateItems(filteredActivities, page, ACTIVITY_LIST_PAGE_SIZE),
    [filteredActivities, page],
  );

  useEffect(() => {
    if (page > pagination.totalPages) {
      setPage(pagination.totalPages);
    }
  }, [page, pagination.totalPages]);

  function openCreateDrawer() {
    setEditingActivity(null);
    setFormValues(createDefaultFormValues());
    setFormError(null);
    setDrawerMode("create");
  }

  function openEditDrawer(activity: ActivityType) {
    setEditingActivity(activity);
    setFormValues(activityTypeToFormValues(activity));
    setFormError(null);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setEditingActivity(null);
    setFormError(null);
  }

  function handleSave() {
    const validationError = validateActivityFormValues(formValues);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);

    if (drawerMode === "create") {
      const formData = new FormData();
      formData.set("name", formValues.name.trim());
      formData.set("description", formValues.description ?? "");
      formData.set("points", String(formValues.points));
      if (formValues.daily_limit !== null) {
        formData.set("daily_limit", String(formValues.daily_limit));
      }
      if (formValues.weekly_limit !== null) {
        formData.set("weekly_limit", String(formValues.weekly_limit));
      }
      if (formValues.is_private_default) {
        formData.set("is_private_default", "on");
      }

      startTransition(async () => {
        const result = await createActivityType(groupId, formData);
        if (!result.success) {
          setFormError(result.error);
          showToast(result.error, "error");
          return;
        }

        if (!formValues.is_active && result.data?.activityId) {
          await updateActivityType(result.data.activityId, groupId, {
            is_active: false,
          });
        }

        closeDrawer();
        showToast("Atividade criada com sucesso.", "success");
        router.refresh();
      });
      return;
    }

    if (!editingActivity) return;

    startTransition(async () => {
      const result = await updateActivityType(editingActivity.id, groupId, {
        name: formValues.name.trim(),
        description: formValues.description,
        points: formValues.points,
        daily_limit: formValues.daily_limit,
        weekly_limit: formValues.weekly_limit,
        is_active: formValues.is_active,
        is_private_default: formValues.is_private_default,
      });

      if (!result.success) {
        setFormError(result.error);
        showToast(result.error, "error");
        return;
      }

      closeDrawer();
      showToast("Atividade atualizada com sucesso.", "success");
      router.refresh();
    });
  }

  function handleToggleActive(activity: ActivityType) {
    startTransition(async () => {
      const result = await updateActivityType(activity.id, groupId, {
        is_active: !activity.is_active,
      });

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      showToast(
        activity.is_active ? "Atividade desativada." : "Atividade ativada.",
        "success",
      );
      router.refresh();
    });
  }

  function handleDuplicate(activity: ActivityType) {
    const duplicateValues: ActivityFormValues = {
      ...activityTypeToFormValues(activity),
      name: `${activity.name} (cópia)`,
      is_active: true,
    };

    setEditingActivity(null);
    setFormValues(duplicateValues);
    setFormError(null);
    setDrawerMode("create");
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteActivityType(deleteTarget.id, groupId);
      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      setDeleteTarget(null);
      showToast(
        result.data?.deactivated
          ? `"${deleteTarget.name}" desativada (possui check-ins).`
          : "Atividade excluída com sucesso.",
        "success",
      );
      router.refresh();
    });
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Atividades do grupo</h2>
        <p className="text-sm text-muted">
          Configure as atividades disponíveis para os check-ins deste grupo.
        </p>
        <p className="text-xs text-muted">
          {activities.length} {activities.length === 1 ? "atividade" : "atividades"} ·{" "}
          {activeCount} {activeCount === 1 ? "ativa" : "ativas"}
        </p>
      </div>

      <ActivityFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        headerAction={
          <Button type="button" className="shrink-0" onClick={openCreateDrawer}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova atividade</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        }
      />

      {activities.length === 0 ? (
        <ActivitiesEmptyState variant="none" onCreate={openCreateDrawer} />
      ) : filteredActivities.length === 0 ? (
        <ActivitiesEmptyState variant="search" />
      ) : (
        <div className="space-y-3">
          {pagination.items.map((activity) => (
            <ActivityCompactCard
              key={activity.id}
              name={activity.name}
              points={activity.points}
              daily_limit={activity.daily_limit}
              weekly_limit={activity.weekly_limit}
              is_active={activity.is_active}
              is_private_default={activity.is_private_default}
              disabled={isPending}
              onOpen={() => openEditDrawer(activity)}
              onEdit={() => openEditDrawer(activity)}
              onDuplicate={() => handleDuplicate(activity)}
              onToggleActive={() => handleToggleActive(activity)}
              onDelete={() => setDeleteTarget(activity)}
            />
          ))}

          <ActivityListPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            onPageChange={setPage}
          />
        </div>
      )}

      <ActivityDrawer
        open={drawerMode !== null}
        title={drawerMode === "create" ? "Nova atividade" : "Editar atividade"}
        onClose={closeDrawer}
        error={formError}
        footer={
          <ActivityDrawerFooter
            onCancel={closeDrawer}
            onSave={handleSave}
            saving={isPending}
            saveLabel={drawerMode === "create" ? "Criar atividade" : "Salvar alterações"}
          />
        }
      >
        <ActivityForm
          mode={drawerMode === "create" ? "create" : "edit"}
          values={formValues}
          onChange={setFormValues}
          disabled={isPending}
        />
      </ActivityDrawer>

      <DeleteActivityDialog
        open={deleteTarget !== null}
        activityName={deleteTarget?.name ?? ""}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={isPending}
      />
    </section>
  );
}
