"use client";

import { GroupSwitcher } from "@/components/groups/group-switcher";
import { NotificationBell } from "@/components/layout/notification-bell";
import type { GroupWithRole } from "@/types/database";

interface AppHeaderProps {
  groups: GroupWithRole[];
  activeGroupId: string | null;
  unreadCount?: number;
}

export function AppHeader({ groups, activeGroupId, unreadCount = 0 }: AppHeaderProps) {
  const activeGroup = groups.find((g) => g.id === activeGroupId);

  return (
    <header className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-border">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">Grupo ativo</p>
        <GroupSwitcher groups={groups} activeGroupId={activeGroupId} variant="light" />
        {activeGroup && groups.length > 1 && (
          <p className="text-[10px] text-muted mt-0.5 truncate">
            {groups.length} grupos · toque para alternar
          </p>
        )}
      </div>
      <NotificationBell initialUnreadCount={unreadCount} />
    </header>
  );
}
