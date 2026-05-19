import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Settings, Trophy, Users } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import {
  getUserGroups,
  getGroupById,
  getGroupMemberStats,
} from "@/actions/groups";
import { PageHeader } from "@/components/layout/page-header";
import { GroupMembersList } from "@/components/groups/group-members-list";
import { GroupSwitcher } from "@/components/groups/group-switcher";
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
  const members = await getGroupMemberStats(activeGroup.id);

  if (!group) redirect("/");

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

      <div className="grid grid-cols-2 gap-3">
        <Link href="/ranking">
          <Card padding="sm" className="flex items-center gap-3 hover:ring-2 hover:ring-primary/20 transition-all">
            <Trophy className="h-8 w-8 text-accent shrink-0" />
            <div>
              <p className="font-semibold text-sm">Ranking</p>
              <p className="text-xs text-muted">Ver pontuação</p>
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
      </div>

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
