import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen gradient-subtle">
      <main className="mx-auto max-w-lg px-4 pt-6 safe-bottom">{children}</main>
      <BottomNav />
    </div>
  );
}
