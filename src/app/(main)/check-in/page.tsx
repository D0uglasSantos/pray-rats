import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups, getActivitiesByGroupIds } from "@/actions/groups";
import { PageHeader } from "@/components/layout/page-header";
import { CheckinForm } from "@/components/checkins/checkin-form";
import type { ActivityType, GroupWithRole } from "@/types/database";

export default async function CheckInPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = (await getUserGroups(user.id)) as GroupWithRole[];
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  if (!activeGroupId) redirect("/onboarding");

  const activitiesByGroupId = await getActivitiesByGroupIds(groups.map((group) => group.id));
  const activities = (activitiesByGroupId[activeGroupId] ?? []) as ActivityType[];

  return (
    <div>
      <PageHeader
        title="Novo check-in"
        subtitle={
          groups.length > 1
            ? "Registre em um ou mais grupos"
            : "Registre um momento de fé"
        }
      />
      <CheckinForm
        groups={groups}
        sourceGroupId={activeGroupId}
        activities={activities}
        activitiesByGroupId={activitiesByGroupId}
      />
    </div>
  );
}
