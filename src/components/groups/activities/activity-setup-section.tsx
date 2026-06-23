"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { ActivityDraft } from "@/lib/activity-drafts";
import {
  ACTIVITY_LIST_PAGE_SIZE,
  createDefaultFormValues,
  draftToFormValues,
  formValuesToDraft,
  matchesActivityFilter,
  paginateItems,
  validateActivityFormValues,
  type ActivityFilter,
  type ActivityFormValues,
} from "@/lib/activity-display";
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

interface ActivitySetupSectionProps {
  activities: ActivityDraft[];
  onChange: (activities: ActivityDraft[]) => void;
  disabled?: boolean;
}

type DrawerMode = "create" | "edit" | null;

export function ActivitySetupSection({
  activities,
  onChange,
  disabled = false,
}: ActivitySetupSectionProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [page, setPage] = useState(1);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<ActivityFormValues>(createDefaultFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivityDraft | null>(null);

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
    setEditingClientId(null);
    setFormValues(createDefaultFormValues());
    setFormError(null);
    setDrawerMode("create");
  }

  function openEditDrawer(activity: ActivityDraft) {
    setEditingClientId(activity.clientId);
    setFormValues(draftToFormValues(activity));
    setFormError(null);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setEditingClientId(null);
    setFormError(null);
  }

  function handleSave() {
    const validationError = validateActivityFormValues(formValues);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (drawerMode === "create") {
      onChange([
        ...activities,
        formValuesToDraft(formValues, crypto.randomUUID()),
      ]);
      closeDrawer();
      return;
    }

    if (!editingClientId) return;

    onChange(
      activities.map((activity) =>
        activity.clientId === editingClientId
          ? formValuesToDraft(formValues, activity.clientId)
          : activity,
      ),
    );
    closeDrawer();
  }

  function handleToggleActive(activity: ActivityDraft) {
    onChange(
      activities.map((item) =>
        item.clientId === activity.clientId
          ? { ...item, is_active: !item.is_active }
          : item,
      ),
    );
  }

  function handleDuplicate(activity: ActivityDraft) {
    setEditingClientId(null);
    setFormValues({
      ...draftToFormValues(activity),
      name: `${activity.name} (cópia)`,
      is_active: true,
    });
    setFormError(null);
    setDrawerMode("create");
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    onChange(activities.filter((item) => item.clientId !== deleteTarget.clientId));
    setDeleteTarget(null);
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm text-muted">
          Personalize as atividades antes de finalizar. Você poderá editar depois no
          admin do grupo.
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
          <Button
            type="button"
            className="shrink-0"
            disabled={disabled}
            onClick={openCreateDrawer}
          >
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
              key={activity.clientId}
              name={activity.name}
              points={activity.points}
              daily_limit={activity.daily_limit}
              weekly_limit={activity.weekly_limit}
              is_active={activity.is_active}
              is_private_default={activity.is_private_default}
              disabled={disabled}
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
            saveLabel={drawerMode === "create" ? "Adicionar atividade" : "Salvar alterações"}
          />
        }
      >
        <ActivityForm
          mode={drawerMode === "create" ? "create" : "edit"}
          values={formValues}
          onChange={setFormValues}
          disabled={disabled}
        />
      </ActivityDrawer>

      <DeleteActivityDialog
        open={deleteTarget !== null}
        activityName={deleteTarget?.name ?? ""}
        description="Essa atividade será removida da configuração inicial do grupo."
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
