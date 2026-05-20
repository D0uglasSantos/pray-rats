import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups, isUserInGroup } from "@/actions/groups";
import { getUserStats } from "@/actions/checkins";
import { getProfile } from "@/actions/profile";
import {
  buildCheckinsByDay,
  CheckinCalendar,
  monthNavigationHrefs,
  parseMonthParam,
} from "@/components/checkins/checkin-calendar";
import { CheckinCard } from "@/components/checkins/checkin-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function formatActiveTime(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { userId } = await params;
  const { month: monthParam } = await searchParams;

  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  if (!activeGroupId) redirect("/onboarding");

  const isMember = await isUserInGroup(activeGroupId, userId);
  if (!isMember) notFound();

  const viewerIsMember = await isUserInGroup(activeGroupId, user.id);
  if (!viewerIsMember) redirect("/onboarding");

  const profile = await getProfile(userId);
  if (!profile) notFound();

  const stats = await getUserStats(userId, activeGroupId);
  const now = new Date();
  const month = parseMonthParam(monthParam, now);
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const checkinsByDay = buildCheckinsByDay(stats.checkins, monthStart, monthEnd);
  const nav = monthNavigationHrefs(userId, month, now);
  const isOwnProfile = userId === user.id;

  return (
    <div className="space-y-6">
      <Link
        href="/group"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar ao grupo
      </Link>

      <div className="flex flex-col items-center text-center gap-3">
        <Avatar src={profile.avatar_url} name={profile.name} size="lg" className="h-24 w-24 text-2xl" />
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          {isOwnProfile && (
            <p className="text-sm text-primary mt-0.5">Seu perfil no grupo</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Card padding="sm">
          <p className="text-2xl font-bold text-primary">{stats.totalCheckins}</p>
          <p className="text-xs text-muted">Check-ins</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-bold text-primary">{stats.activeDays}</p>
          <p className="text-xs text-muted">Dias ativos</p>
        </Card>
        <Card padding="sm">
          <p className="text-2xl font-bold text-primary">
            {formatActiveTime(stats.totalActiveMinutes)}
          </p>
          <p className="text-xs text-muted">Tempo ativo</p>
        </Card>
      </div>

      <CheckinCalendar
        month={month}
        checkinsByDay={checkinsByDay}
        prevMonthHref={nav.prev}
        nextMonthHref={nav.next}
        today={now}
      />

      {stats.checkins.length > 0 && (
        <a href="#checkins" className="block">
          <Button variant="secondary" fullWidth>
            Ver todos os check-ins
          </Button>
        </a>
      )}

      <section id="checkins">
        <h2 className="font-semibold mb-3">Todos os check-ins</h2>
        {stats.checkins.length === 0 ? (
          <Card padding="sm">
            <p className="text-sm text-muted text-center py-4">
              Nenhum check-in registrado ainda.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {stats.checkins.map((checkin) => (
              <CheckinCard
                key={checkin.id}
                checkin={{
                  ...checkin,
                  profile: { name: profile.name, avatar_url: profile.avatar_url },
                  activity_type: Array.isArray(checkin.activity_type)
                    ? checkin.activity_type[0]
                    : checkin.activity_type,
                }}
                hideProfileLink
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
