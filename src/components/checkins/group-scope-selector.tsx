"use client";

import { cn } from "@/lib/utils/cn";
import type { GroupWithRole } from "@/types/database";

interface GroupScopeSelectorProps {
  groups: GroupWithRole[];
  selectedGroupIds: string[];
  onChange: (groupIds: string[]) => void;
  disabled?: boolean;
  unavailableByGroupId?: Record<string, string | undefined>;
}

export function GroupScopeSelector({
  groups,
  selectedGroupIds,
  onChange,
  disabled = false,
  unavailableByGroupId = {},
}: GroupScopeSelectorProps) {
  if (groups.length <= 1) {
    const group = groups[0];
    if (!group) return null;

    return (
      <div className="rounded-xl border border-border bg-surface-secondary px-3 py-2">
        <p className="text-xs text-muted">Grupo</p>
        <p className="text-sm font-medium">{group.name}</p>
        <input type="hidden" name="group_ids" value={group.id} />
      </div>
    );
  }

  const allSelected = selectedGroupIds.length === groups.length;
  const availableGroups = groups.filter((group) => !unavailableByGroupId[group.id]);

  function toggleAll() {
    if (allSelected) {
      onChange(availableGroups.length > 0 ? [availableGroups[0]!.id] : []);
      return;
    }
    onChange(availableGroups.map((group) => group.id));
  }

  function toggleGroup(groupId: string) {
    const unavailable = unavailableByGroupId[groupId];
    if (unavailable) return;

    if (selectedGroupIds.includes(groupId)) {
      if (selectedGroupIds.length === 1) return;
      onChange(selectedGroupIds.filter((id) => id !== groupId));
      return;
    }

    onChange([...selectedGroupIds, groupId]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Grupos</p>
        <button
          type="button"
          disabled={disabled || availableGroups.length === 0}
          onClick={toggleAll}
          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
        >
          {allSelected ? "Desmarcar todos" : "Selecionar todos"}
        </button>
      </div>

      <div className="space-y-2">
        {groups.map((group) => {
          const unavailable = unavailableByGroupId[group.id];
          const checked = selectedGroupIds.includes(group.id);

          return (
            <label
              key={group.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                unavailable
                  ? "border-border/60 bg-surface-secondary/50 opacity-60 cursor-not-allowed"
                  : checked
                    ? "border-primary bg-primary/5 cursor-pointer"
                    : "border-border bg-surface cursor-pointer hover:border-primary/30",
              )}
            >
              <input
                type="checkbox"
                name="group_ids"
                value={group.id}
                checked={checked}
                disabled={disabled || Boolean(unavailable)}
                onChange={() => toggleGroup(group.id)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{group.name}</span>
                {unavailable ? (
                  <span className="block text-[11px] text-muted mt-0.5">{unavailable}</span>
                ) : (
                  <span className="block text-[11px] text-muted mt-0.5">
                    {group.role === "admin" ? "Admin" : "Membro"}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        {selectedGroupIds.length} de {groups.length} grupo
        {groups.length !== 1 ? "s" : ""} selecionado
        {selectedGroupIds.length !== 1 ? "s" : ""}.
      </p>
    </div>
  );
}
