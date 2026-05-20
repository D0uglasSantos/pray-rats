import Link from "next/link";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCheckinImageDisplayUrl } from "@/lib/checkin-image-url";
import { memberProfilePath } from "@/lib/member-profile-path";
import { cn } from "@/lib/utils/cn";

export interface CheckinDayEntry {
  imageUrl?: string | null;
}

const WEEKDAYS = ["dom.", "seg.", "ter.", "qua.", "qui.", "sex.", "sáb."];

interface CheckinCalendarProps {
  month: Date;
  checkinsByDay: Record<string, CheckinDayEntry>;
  prevMonthHref?: string;
  nextMonthHref?: string;
  today?: Date;
}

export function CheckinCalendar({
  month,
  checkinsByDay,
  prevMonthHref,
  nextMonthHref,
  today = new Date(),
}: CheckinCalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const canGoNext = startOfMonth(month) < startOfMonth(today);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        {prevMonthHref ? (
          <Link
            href={prevMonthHref}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ) : (
          <div className="w-8" />
        )}
        <p className="font-semibold capitalize">
          {format(month, "MMMM yyyy", { locale: ptBR })}
        </p>
        {nextMonthHref && canGoNext ? (
          <Link
            href={nextMonthHref}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAYS.map((d) => (
          <span key={d} className="text-[10px] text-muted font-medium py-1">
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const entry = checkinsByDay[key];
          const hasCheckin = Boolean(entry);
          const isToday = isSameDay(day, today);
          const imageUrl = entry?.imageUrl
            ? getCheckinImageDisplayUrl(entry.imageUrl)
            : null;

          return (
            <div
              key={key}
              className={cn(
                "aspect-square flex items-center justify-center rounded-lg text-xs overflow-hidden",
                hasCheckin && !imageUrl && "bg-primary text-white font-semibold",
                !hasCheckin && "text-muted",
                isToday && !hasCheckin && "ring-2 ring-primary/30",
                hasCheckin && imageUrl && "ring-1 ring-primary/20",
              )}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt=""
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                format(day, "d")
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function buildCheckinsByDay(
  checkins: Array<{ checked_in_at: string; image_url?: string | null }>,
  monthStart: Date,
  monthEnd: Date,
): Record<string, CheckinDayEntry> {
  const byDay: Record<string, CheckinDayEntry> = {};

  for (const checkin of checkins) {
    const date = new Date(checkin.checked_in_at);
    if (date < monthStart || date > monthEnd) continue;

    const key = format(date, "yyyy-MM-dd");
    if (!byDay[key]) {
      byDay[key] = { imageUrl: checkin.image_url };
    }
  }

  return byDay;
}

export function formatMonthParam(date: Date): string {
  return format(date, "yyyy-MM");
}

export function parseMonthParam(param: string | undefined, fallback: Date): Date {
  if (!param || !/^\d{4}-\d{2}$/.test(param)) return fallback;
  const [year, month] = param.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function monthNavigationHrefs(
  userId: string,
  month: Date,
  today = new Date(),
): { prev: string; next: string | undefined } {
  const prev = subMonths(month, 1);
  const next = addMonths(month, 1);

  return {
    prev: memberProfilePath(userId, formatMonthParam(prev)),
    next:
      startOfMonth(next) <= startOfMonth(today)
        ? memberProfilePath(userId, formatMonthParam(next))
        : undefined,
  };
}
