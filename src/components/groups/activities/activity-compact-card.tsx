"use client";

import { Badge } from "@/components/ui/badge";
import { ActivityActionsMenu } from "@/components/groups/activities/activity-actions-menu";
import {
  formatActivitySummary,
  formatPrivacyLabel,
} from "@/lib/activity-display";
import { cn } from "@/lib/utils/cn";

interface ActivityCompactCardProps {
  name: string;
  points: number;
  daily_limit: number | null;
  weekly_limit: number | null;
  is_active: boolean;
  is_private_default: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function ActivityCompactCard({
  name,
  points,
  daily_limit,
  weekly_limit,
  is_active,
  is_private_default,
  onOpen,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
  disabled = false,
}: ActivityCompactCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-sm p-4",
        !is_active && "opacity-80",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onOpen}
          className={cn(
            "flex-1 min-w-0 text-left",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-lg -m-1 p-1",
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-medium text-foreground truncate">{name}</p>
            <Badge variant={is_active ? "success" : "default"} className="shrink-0">
              {is_active ? "Ativa" : "Inativa"}
            </Badge>
          </div>
          <p className="text-sm text-muted">
            {formatActivitySummary({ points, daily_limit, weekly_limit })}
          </p>
          <p className="text-xs text-muted mt-1">
            {formatPrivacyLabel(is_private_default)}
          </p>
        </button>

        <ActivityActionsMenu
          isActive={is_active}
          disabled={disabled}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
