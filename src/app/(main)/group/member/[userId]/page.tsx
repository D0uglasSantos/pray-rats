import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { startOfMonth, endOfMonth } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getSharedGroupId, getUserGroups, isUserInGroup } from "@/actions/groups";
import { getUserStats } from "@/actions/checkins";
import { getProfile } from "@/actions/profile";
import { canViewProfile, getFollowStatus } from "@/actions/follows";
import {
  buildCheckinsByDay,
  CheckinCalendar,
  monthNavigationHrefs,
  parseMonthParam,
} from "@/components/checkins/checkin-calendar";
import { CheckinCard } from "@/components/checkins/checkin-card";
import { CheckinOwnerActions } from "@/components/checkins/checkin-owner-actions";
import { FollowButton } from "@/components/social/follow-button";
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

  const allowed = await canViewProfile(user.id, userId);
  if (!allowed) notFound();

  const profile = await getProfile(userId);
  if (!profile) notFound();

  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  const sharedGroupId = await getSharedGroupId(user.id, userId);

  const statsGroupId =
    sharedGroupId ??
    (activeGroupId && (await isUserInGroup(activeGroupId, userId)) ? activeGroupId : null);
  const stats = statsGroupId
    ? await getUserStats(userId, statsGroupId)
    : {
        totalCheckins: 0,
        activeDays: 0,
        totalActiveMinutes: 0,
        checkins: [],
      };

  const followStatus = userId !== user.id ? await getFollowStatus(userId) : null;

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
        href={sharedGroupId ? "/group" : "/profile/following"}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div className="flex flex-col items-center text-center gap-3">
        <Avatar src={profile.avatar_url} name={profile.name} size="lg" className="h-24 w-24 text-2xl" />
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          {profile.bio && <p className="text-sm text-muted mt-1 max-w-xs">{profile.bio}</p>}
          {isOwnProfile && (
            <p className="text-sm text-primary mt-0.5">Seu perfil</p>
          )}
          {followStatus?.isFriend && (
            <p className="text-sm text-primary mt-0.5">Amigos</p>
          )}
        </div>
        {followStatus && <FollowButton targetUserId={userId} initialStatus={followStatus} />}
      </div>

      {sharedGroupId && (
        <>
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
              <div key={checkin.id} className="relative">
                {isOwnProfile && (
                  <div className="absolute top-3 right-3 z-10">
                    <CheckinOwnerActions checkinId={checkin.id} />
                  </div>
                )}
                <CheckinCard
                  checkin={{
                    ...checkin,
                    profile: { name: profile.name, avatar_url: profile.avatar_url },
                    activity_type: Array.isArray(checkin.activity_type)
                      ? checkin.activity_type[0]
                      : checkin.activity_type,
                  }}
                  hideProfileLink
                />
              </div>
            ))}
          </div>
            )}
          </section>
        </>
      )}

      {!sharedGroupId && (
        <Card padding="sm">
          <p className="text-sm text-muted text-center py-4">
            Vocês não compartilham um grupo ativo. Siga este usuário para acompanhar a amizade.
          </p>
        </Card>
      )}
    </div>
  );
}
