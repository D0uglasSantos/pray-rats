import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups, getGroupActivities } from "@/actions/groups";
import { PageHeader } from "@/components/layout/page-header";
import { CheckinForm } from "@/components/checkins/checkin-form";
import type { ActivityType } from "@/types/database";

export default async function CheckInPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  if (!activeGroupId) redirect("/onboarding");

  const activities = (await getGroupActivities(activeGroupId)) as ActivityType[];

  return (
    <div>
      <PageHeader
        title="Novo check-in"
        subtitle="Registre um momento de fé"
      />
      <CheckinForm groupId={activeGroupId} activities={activities} />
    </div>
  );
}
