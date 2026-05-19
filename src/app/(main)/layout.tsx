import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getUserGroups } from "@/actions/groups";
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

  return <AppShell>{children}</AppShell>;
}
