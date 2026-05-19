import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { getFeedCheckins } from "@/actions/checkins";
import { PageHeader } from "@/components/layout/page-header";
import { CheckinCard } from "@/components/checkins/checkin-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedList } from "@/components/checkins/feed-list";

export default async function FeedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  if (!activeGroupId) redirect("/onboarding");

  const initialCheckins = await getFeedCheckins(activeGroupId, 0, 10);

  return (
    <div>
      <PageHeader
        title="Feed"
        subtitle="Atividades públicas do grupo"
      />
      {initialCheckins.length === 0 ? (
        <EmptyState
          title="Feed vazio"
          description="Quando alguém registrar um check-in público, ele aparecerá aqui."
        />
      ) : (
        <FeedList
          groupId={activeGroupId}
          initialCheckins={initialCheckins}
        />
      )}
    </div>
  );
}
