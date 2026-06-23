import { Suspense } from "react";
import { BottomNav } from "./bottom-nav";
import { NavigationProgress } from "./navigation-progress";
import { AppHeader } from "./app-header";
import { AppTourProvider } from "@/components/tutorial/app-tour-provider";
import type { AppTourState, GroupWithRole } from "@/types/database";

interface AppShellProps {
  children: React.ReactNode;
  groups: GroupWithRole[];
  activeGroupId: string | null;
  unreadCount?: number;
  initialTourState: AppTourState;
}

export function AppShell({
  children,
  groups,
  activeGroupId,
  unreadCount = 0,
  initialTourState,
}: AppShellProps) {
  return (
    <Suspense
      fallback={
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
      }
    >
      <AppTourProvider initialState={initialTourState} hasGroups={groups.length > 0}>
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
      </AppTourProvider>
    </Suspense>
  );
}
