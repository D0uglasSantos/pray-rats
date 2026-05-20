import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth } from "date-fns";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { getUserStats, calculateStreak } from "@/actions/checkins";
import { PageHeader } from "@/components/layout/page-header";
import {
  buildCheckinsByDay,
  CheckinCalendar,
} from "@/components/checkins/checkin-calendar";
import { memberProfilePath } from "@/lib/member-profile-path";
import { Card } from "@/components/ui/card";
import { Flame, Calendar, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function JourneyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  if (!activeGroupId) redirect("/onboarding");

  const stats = await getUserStats(user.id, activeGroupId);
  const streak = await calculateStreak(user.id, activeGroupId);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const checkinsByDay = buildCheckinsByDay(stats.checkins, monthStart, monthEnd);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Caminhada espiritual"
        subtitle="Sua evolução pessoal, sem comparação"
      />

      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm" className="flex items-center gap-3">
          <Flame className="h-8 w-8 text-accent shrink-0" />
          <div>
            <p className="text-2xl font-bold">{streak}</p>
            <p className="text-xs text-muted">dias seguidos</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="text-2xl font-bold">{stats.daysThisMonth}</p>
            <p className="text-xs text-muted">dias este mês</p>
          </div>
        </Card>
      </div>

      {stats.topActivity && (
        <Card padding="sm" className="flex items-center gap-3">
          <Award className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="text-sm text-muted">Atividade mais praticada</p>
            <p className="font-semibold">
              {stats.topActivity.name} ({stats.topActivity.count}x)
            </p>
          </div>
        </Card>
      )}

      <CheckinCalendar month={now} checkinsByDay={checkinsByDay} today={now} />

      <Link href={memberProfilePath(user.id)}>
        <Button variant="secondary" fullWidth>
          Ver calendário completo
        </Button>
      </Link>

      <Card padding="sm">
        <p className="text-sm text-muted text-center italic">
          &ldquo;Você está perseverando bem. Continue firme na caminhada.&rdquo;
        </p>
      </Card>
    </div>
  );
}
