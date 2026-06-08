import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, Newspaper, Settings, Users } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import {
  getUserGroups,
  getGroupById,
  getGroupMemberStats,
  getGroupStats,
} from "@/actions/groups";
import { getRanking } from "@/actions/profile";
import { PageHeader } from "@/components/layout/page-header";
import { GroupMembersList } from "@/components/groups/group-members-list";
import { GroupStats } from "@/components/groups/group-stats";
import { GroupSwitcher } from "@/components/groups/group-switcher";
import { RankingPreview } from "@/components/ranking/ranking-preview";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GroupWithRole } from "@/types/database";

export default async function GroupPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = (await getUserGroups(user.id)) as GroupWithRole[];
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  if (!activeGroupId) redirect("/onboarding");

  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];
  const group = await getGroupById(activeGroup.id);
  if (!group) redirect("/home");

  const members = await getGroupMemberStats(activeGroup.id);
  const rankings = await getRanking(activeGroup.id, "general", {
    currentUserId: user.id,
    limit: 20,
  });
  const groupStats = await getGroupStats(activeGroup.id, group.start_date);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grupo"
        subtitle={group.name}
        action={
          activeGroup.role === "admin" ? (
            <Link
              href={`/groups/${activeGroup.id}/admin`}
              className="p-2 rounded-xl bg-surface-secondary text-primary"
              aria-label="Administrar grupo"
            >
              <Settings className="h-5 w-5" />
            </Link>
          ) : undefined
        }
      />

      {groups.length > 1 && (
        <Card padding="sm">
          <p className="text-xs text-muted mb-2">Grupo ativo</p>
          <GroupSwitcher groups={groups} activeGroupId={activeGroup.id} variant="light" />
        </Card>
      )}

      {groups.length > 1 && (
        <Link href="/groups">
          <Card padding="sm" className="flex items-center justify-between hover:ring-2 hover:ring-primary/20 transition-all">
            <div>
              <p className="font-semibold text-sm">Todos os meus grupos</p>
              <p className="text-xs text-muted">{groups.length} grupos · feeds e detalhes</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted shrink-0" />
          </Card>
        </Link>
      )}

      <Card className="space-y-3">
        <h2 className="font-bold text-lg">{group.name}</h2>
        {group.description && (
          <p className="text-sm text-muted">{group.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs">
          {group.start_date && (
            <Badge variant="default">
              Início:{" "}
              {format(new Date(group.start_date), "d MMM yyyy", { locale: ptBR })}
            </Badge>
          )}
          {group.end_date && (
            <Badge variant="default">
              Fim:{" "}
              {format(new Date(group.end_date), "d MMM yyyy", { locale: ptBR })}
            </Badge>
          )}
          <Badge variant="accent">Código: {group.invite_code}</Badge>
        </div>
      </Card>

      <RankingPreview rankings={rankings} currentUserId={user.id} />

      <GroupStats
        totalCheckins={groupStats.totalCheckins}
        avgCheckinsPerDay={groupStats.avgCheckinsPerDay}
      />

      <Link href={`/feed?group=${activeGroup.id}`}>
        <Card padding="sm" className="flex items-center gap-3 hover:ring-2 hover:ring-primary/20 transition-all">
          <Newspaper className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="font-semibold text-sm">Feed do grupo</p>
            <p className="text-xs text-muted">Ver check-ins de todos</p>
          </div>
        </Card>
      </Link>

      <Card padding="sm" className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary shrink-0" />
        <div>
          <p className="font-semibold text-sm">{members.length}</p>
          <p className="text-xs text-muted">participantes</p>
        </div>
      </Card>

      <section>
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Participantes
        </h2>
        <GroupMembersList members={members} currentUserId={user.id} />
      </section>
    </div>
  );
}
