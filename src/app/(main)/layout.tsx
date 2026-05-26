import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getUserGroups } from "@/actions/groups";
import { getUnreadCount } from "@/actions/notifications";
import { getActiveGroupId } from "@/lib/active-group";
import { AppShell } from "@/components/layout/app-shell";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  if (groups.length === 0) redirect("/onboarding");

  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id ?? null;
  const unreadCount = await getUnreadCount();

  return (
    <AppShell
      groups={groups}
      activeGroupId={activeGroupId}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
