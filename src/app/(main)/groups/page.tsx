import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight, Newspaper, Plus, Users } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { PageHeader } from "@/components/layout/page-header";
import { GroupSwitcher } from "@/components/groups/group-switcher";
import { ActivateGroupButton } from "@/components/groups/activate-group-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GroupWithRole } from "@/types/database";

export default async function GroupsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = (await getUserGroups(user.id)) as GroupWithRole[];
  if (groups.length === 0) redirect("/onboarding");

  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus grupos"
        subtitle={`Você participa de ${groups.length} grupo${groups.length !== 1 ? "s" : ""}`}
        action={
          <Link href="/groups/join">
            <Button size="sm" variant="secondary">
              <Plus className="h-4 w-4" /> Entrar
            </Button>
          </Link>
        }
      />

      {groups.length > 1 && (
        <Card padding="sm">
          <p className="text-xs text-muted mb-2">Grupo ativo (home, ranking, check-in)</p>
          <GroupSwitcher groups={groups} activeGroupId={activeGroupId} variant="light" />
        </Card>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const isActive = group.id === activeGroupId;

          return (
            <Card key={group.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold text-lg truncate">{group.name}</h2>
                    {isActive && <Badge variant="primary">Ativo</Badge>}
                    {group.role === "admin" && <Badge variant="accent">Admin</Badge>}
                  </div>
                  {group.description && (
                    <p className="text-sm text-muted mt-1 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    {group.start_date && (
                      <Badge variant="default">
                        Início:{" "}
                        {format(new Date(group.start_date), "d MMM yyyy", { locale: ptBR })}
                      </Badge>
                    )}
                    <Badge variant="default">Código: {group.invite_code}</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href={`/feed?group=${group.id}`}>
                  <Card
                    padding="sm"
                    className="flex items-center gap-2 hover:ring-2 hover:ring-primary/20 transition-all h-full"
                  >
                    <Newspaper className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">Feed</p>
                      <p className="text-[10px] text-muted truncate">Check-ins públicos</p>
                    </div>
                  </Card>
                </Link>
                <Link href="/group">
                  <Card
                    padding="sm"
                    className="flex items-center gap-2 hover:ring-2 hover:ring-primary/20 transition-all h-full"
                  >
                    <Users className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">Detalhes</p>
                      <p className="text-[10px] text-muted truncate">
                        {isActive ? "Membros e ranking" : "Ative para ver detalhes"}
                      </p>
                    </div>
                  </Card>
                </Link>
              </div>

              {!isActive && (
                <ActivateGroupButton groupId={group.id} groupName={group.name} />
              )}
            </Card>
          );
        })}
      </div>

      <Link href="/groups/create">
        <Card padding="sm" className="flex items-center gap-3 hover:ring-2 hover:ring-primary/20 transition-all">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Criar novo grupo</p>
            <p className="text-xs text-muted">Inicie um desafio espiritual</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted shrink-0" />
        </Card>
      </Link>
    </div>
  );
}
