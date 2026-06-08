import Link from "next/link";
import { redirect } from "next/navigation";
import { Newspaper } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { getFeedCheckins } from "@/actions/checkins";
import { PageHeader } from "@/components/layout/page-header";
import { FeedList } from "@/components/checkins/feed-list";
import { FeedGroupTabs } from "@/components/checkins/feed-group-tabs";
import { EmptyState } from "@/components/ui/empty-state";
import type { GroupWithRole } from "@/types/database";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = (await getUserGroups(user.id)) as GroupWithRole[];
  const { group: groupParam } = await searchParams;

  const defaultGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  const feedGroupId =
    groupParam && groups.some((group) => group.id === groupParam)
      ? groupParam
      : defaultGroupId;

  if (!feedGroupId) redirect("/onboarding");

  const activeGroup = groups.find((group) => group.id === feedGroupId)!;
  const { items, hasMore, nextCursor } = await getFeedCheckins(feedGroupId, null, 20);

  return (
    <div>
      <PageHeader
        title="Feed"
        subtitle={`Atividades públicas · ${activeGroup.name}`}
      />

      <div className="mb-4">
        <FeedGroupTabs groups={groups} activeGroupId={feedGroupId} />
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="Feed vazio"
          description="Quando alguém registrar um check-in público neste grupo, ele aparecerá aqui."
        />
      ) : (
        <FeedList
          groupId={feedGroupId}
          initialItems={items}
          initialNextCursor={nextCursor}
          initialHasMore={hasMore}
        />
      )}

      {groups.length > 1 && (
        <p className="text-center text-xs text-muted mt-6">
          <Link href="/groups" className="text-primary hover:underline">
            Ver todos os meus grupos
          </Link>
        </p>
      )}
    </div>
  );
}
