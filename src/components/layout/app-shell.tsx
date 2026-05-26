import { BottomNav } from "./bottom-nav";
import { NavigationProgress } from "./navigation-progress";
import { AppHeader } from "./app-header";
import type { GroupWithRole } from "@/types/database";

interface AppShellProps {
  children: React.ReactNode;
  groups: GroupWithRole[];
  activeGroupId: string | null;
  unreadCount?: number;
}

export function AppShell({
  children,
  groups,
  activeGroupId,
  unreadCount = 0,
}: AppShellProps) {
  return (
    <div className="min-h-screen gradient-subtle">
      <NavigationProgress />
      <main className="mx-auto max-w-lg px-4 pt-6 safe-bottom">
        <AppHeader
          groups={groups}
          activeGroupId={activeGroupId}
          unreadCount={unreadCount}
        />
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
