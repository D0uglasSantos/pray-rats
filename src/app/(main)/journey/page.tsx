import { redirect } from "next/navigation";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { getUserStats } from "@/actions/checkins";
import { computeBestStreak } from "@/lib/user-records";
import {
  buildCheckinsByDay,
  CheckinCalendar,
} from "@/components/checkins/checkin-calendar";
import { memberProfilePath } from "@/lib/member-profile-path";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Flame, CheckSquare, Star, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

const BAR_COLORS = [
  "bg-primary",
  "bg-accent",
  "bg-primary-light",
  "bg-primary/60",
  "bg-accent/60",
  "bg-primary/40",
];

function getMotivationalMessage(streak: number): string {
  if (streak === 0) return "Cada dia é uma nova chance de se aproximar de Deus.";
  if (streak === 1) return "Você deu o primeiro passo! Continue amanhã.";
  if (streak <= 3) return "O hábito está nascendo. Continue firme!";
  if (streak <= 7) return "Uma semana de fé! Sua constância está crescendo.";
  if (streak <= 14) return "Que disciplina espiritual! Deus vê sua dedicação.";
  if (streak <= 30) return "Um mês de constância! Que testemunho de fé.";
  return "Sua perseverança é inspiradora. Continue na comunhão!";
}

function normalizeActivityName(
  activityType: { name?: string } | { name?: string }[] | null | undefined,
): string {
  if (!activityType) return "Outros";
  if (Array.isArray(activityType)) return activityType[0]?.name ?? "Outros";
  return activityType.name ?? "Outros";
}

export default async function JourneyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  if (!activeGroupId) redirect("/onboarding");

  const stats = await getUserStats(user.id, activeGroupId);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const monthLabel = format(now, "MMMM", { locale: ptBR });

  const monthlyCheckins = stats.checkins.filter(
    (c) => new Date(c.checked_in_at) >= monthStart,
  );
  const monthlyPoints = monthlyCheckins.reduce((s, c) => s + c.points, 0);
  const monthlyCount = monthlyCheckins.length;

  const bestStreak = computeBestStreak(
    stats.checkins.map((c) => c.checked_in_at),
  );

  const activityMap: Record<string, { count: number; points: number }> = {};
  for (const c of monthlyCheckins) {
    const name = normalizeActivityName(
      c.activity_type as { name?: string } | { name?: string }[] | null,
    );
    if (!activityMap[name]) activityMap[name] = { count: 0, points: 0 };
    activityMap[name].count++;
    activityMap[name].points += c.points;
  }
  const activityList = Object.entries(activityMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);
  const maxActivityCount = activityList[0]?.[1].count ?? 1;

  const checkinsByDay = buildCheckinsByDay(stats.checkins, monthStart, monthEnd);
  const hasAnyCheckins = stats.checkins.length > 0;
  const hasMonthlyCheckins = monthlyCount > 0;

  if (!hasAnyCheckins) {
    return (
      <div className="space-y-4 pb-6">
        <div className="gradient-spiritual rounded-3xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 rounded-2xl p-4">
              <Flame className="h-10 w-10 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Caminhada espiritual</p>
              <p className="text-xl font-bold mt-0.5">Comece hoje</p>
              <p className="text-white/75 text-sm mt-1">
                Sua jornada está esperando por você.
              </p>
            </div>
          </div>
        </div>

        <EmptyState
          icon={Sparkles}
          title="Nenhum check-in ainda"
          description="Registre sua primeira atividade e veja sua caminhada espiritual tomar forma."
          action={
            <Link href="/check-in">
              <Button>Fazer meu primeiro check-in</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      {/* Hero: streak card */}
      <div className="gradient-spiritual rounded-3xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-white/70 text-sm font-medium mb-1">
              Sequência atual
            </p>
            <div className="flex items-end gap-2">
              <span className="text-6xl font-bold leading-none">
                {stats.currentStreak}
              </span>
              <span className="text-xl font-medium text-white/80 mb-1.5">
                {stats.currentStreak === 1 ? "dia" : "dias"}
              </span>
            </div>
            <p className="mt-3 text-white/85 text-sm leading-relaxed">
              {getMotivationalMessage(stats.currentStreak)}
            </p>
          </div>
          <div className="bg-white/20 rounded-2xl p-4 shrink-0">
            <Flame className="h-10 w-10 text-white" />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="flex flex-col items-center text-center gap-1 py-4">
          <div className="bg-primary/10 rounded-xl p-2 mb-1">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary leading-none">
            {monthlyCount}
          </p>
          <p className="text-[10px] text-muted leading-tight capitalize">
            check-ins
            <br />
            em {monthLabel}
          </p>
        </Card>

        <Card padding="sm" className="flex flex-col items-center text-center gap-1 py-4">
          <div className="bg-primary/10 rounded-xl p-2 mb-1">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary leading-none">
            {monthlyPoints}
          </p>
          <p className="text-[10px] text-muted leading-tight capitalize">
            pontos
            <br />
            em {monthLabel}
          </p>
        </Card>

        <Card padding="sm" className="flex flex-col items-center text-center gap-1 py-4">
          <div className="bg-accent/10 rounded-xl p-2 mb-1">
            <TrendingUp className="h-5 w-5 text-accent" />
          </div>
          <p className="text-2xl font-bold text-accent leading-none">
            {bestStreak}
          </p>
          <p className="text-[10px] text-muted leading-tight">
            melhor
            <br />
            sequência
          </p>
        </Card>
      </div>

      {/* Calendar */}
      <CheckinCalendar month={now} checkinsByDay={checkinsByDay} today={now} />

      {/* Activity breakdown this month */}
      {activityList.length > 0 ? (
        <Card>
          <h3 className="font-semibold mb-4 capitalize">
            Atividades em {monthLabel}
          </h3>
          <div className="space-y-4">
            {activityList.map(([name, data], i) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-muted">
                    {data.count}× · {data.points} pts
                  </span>
                </div>
                <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      BAR_COLORS[i % BAR_COLORS.length],
                    )}
                    style={{
                      width: `${Math.max(8, (data.count / maxActivityCount) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        !hasMonthlyCheckins && (
          <Card padding="lg" className="text-center">
            <p className="font-semibold">Nenhum check-in este mês</p>
            <p className="text-sm text-muted mt-1">
              Que tal retomar sua caminhada hoje?
            </p>
            <div className="mt-4">
              <Link href="/check-in">
                <Button variant="secondary" fullWidth>
                  Fazer check-in agora
                </Button>
              </Link>
            </div>
          </Card>
        )
      )}

      <Link href={memberProfilePath(user.id)}>
        <Button variant="secondary" fullWidth>
          Ver histórico completo
        </Button>
      </Link>
    </div>
  );
}
