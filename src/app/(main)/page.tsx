import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, Star, TrendingUp, ChevronRight } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import {
  getTodayCheckins,
  calculateStreak,
  getWeeklyPoints,
} from "@/actions/checkins";
import { getProfile, getUserRankingPosition } from "@/actions/profile";
import { getCheckinImageDisplayUrl } from "@/lib/checkin-image-url";
import { GroupSwitcher } from "@/components/groups/group-switcher";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? groups[0];

  if (!activeGroup) redirect("/onboarding");

  const profile = await getProfile(user.id);
  const todayCheckins = await getTodayCheckins(activeGroup.id, user.id);
  const weeklyPoints = await getWeeklyPoints(user.id, activeGroup.id);
  const streak = await calculateStreak(user.id, activeGroup.id);
  const rankingPosition = await getUserRankingPosition(
    activeGroup.id,
    user.id,
    "weekly",
  );

  const firstName = profile?.name?.split(" ")[0] ?? "Amigo";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl gradient-spiritual p-5 text-white">
        <p className="text-white/80 text-sm">Como está sua caminhada hoje?</p>
        <h1 className="text-2xl font-bold mt-1">Olá, {firstName} ✝</h1>
        <div className="mt-3">
          <GroupSwitcher groups={groups} activeGroupId={activeGroup.id} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm" className="text-center">
          <Star className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold text-primary">{weeklyPoints}</p>
          <p className="text-xs text-muted">pts esta semana</p>
        </Card>
        <Card padding="sm" className="text-center">
          <Flame className="h-5 w-5 text-accent mx-auto mb-1" />
          <p className="text-2xl font-bold text-primary">{streak}</p>
          <p className="text-xs text-muted">dias seguidos</p>
        </Card>
        <Card padding="sm" className="text-center">
          <TrendingUp className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold text-primary">
            {rankingPosition ? `${rankingPosition}º` : "—"}
          </p>
          <p className="text-xs text-muted">no ranking</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-2xl font-bold text-primary">{todayCheckins.length}</p>
          <p className="text-xs text-muted">check-ins hoje</p>
        </Card>
      </div>

      <div>
        <Link href="/check-in">
          <Button fullWidth size="lg" className="shadow-lg">
            Registrar momento de fé
          </Button>
        </Link>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Check-ins de hoje</h2>
          <div className="flex items-center gap-3">
            <Link href="/feed" className="text-sm text-primary">
              Feed
            </Link>
            <Link href="/group" className="text-sm text-primary flex items-center gap-0.5">
              Ver grupo <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {todayCheckins.length === 0 ? (
          <EmptyState
            title="Nenhum check-in hoje"
            description="Registre um momento de fé e comece sua constância."
            action={
              <Link href="/check-in">
                <Button size="sm">Fazer check-in</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {todayCheckins.map((checkin) => (
              <Card key={checkin.id} padding="sm" className="flex items-center gap-3">
                {checkin.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getCheckinImageDisplayUrl(checkin.image_url)}
                    alt=""
                    className="h-14 w-14 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Badge variant="primary" className="mb-1">
                    {(checkin.activity_type as { name: string })?.name}
                  </Badge>
                  <p className="font-medium truncate">{checkin.title}</p>
                </div>
                <Badge variant="accent">+{checkin.points}</Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      {activeGroup.role === "admin" && (
        <Link href={`/groups/${activeGroup.id}/admin`}>
          <Card padding="sm" className="flex items-center justify-between hover:ring-2 hover:ring-primary/20 transition-all">
            <p className="font-medium text-sm">Administrar grupo</p>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Card>
        </Link>
      )}
    </div>
  );
}
