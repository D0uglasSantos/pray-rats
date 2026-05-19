import { redirect } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { getUserStats, calculateStreak } from "@/actions/checkins";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { Flame, Calendar, Award } from "lucide-react";

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
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const checkinDays = new Set(
    stats.checkins
      .filter((c) => {
        const d = new Date(c.checked_in_at);
        return d >= monthStart && d <= monthEnd;
      })
      .map((c) => format(new Date(c.checked_in_at), "yyyy-MM-dd")),
  );

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

      <Card>
        <p className="font-medium mb-4">
          {format(now, "MMMM yyyy", { locale: ptBR })}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <span key={i} className="text-[10px] text-muted font-medium py-1">
              {d}
            </span>
          ))}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const hasCheckin = checkinDays.has(key);
            const isToday = isSameDay(day, now);

            return (
              <div
                key={key}
                className={cn(
                  "aspect-square flex items-center justify-center rounded-lg text-xs",
                  hasCheckin && "bg-primary text-white font-semibold",
                  !hasCheckin && "text-muted",
                  isToday && !hasCheckin && "ring-2 ring-primary/30",
                )}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding="sm">
        <p className="text-sm text-muted text-center italic">
          &ldquo;Você está perseverando bem. Continue firme na caminhada.&rdquo;
        </p>
      </Card>
    </div>
  );
}
