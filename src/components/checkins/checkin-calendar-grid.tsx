"use client";

import { useState } from "react";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Images } from "lucide-react";
import { getCheckinImageDisplayUrl } from "@/lib/checkin-image-url";
import { cn } from "@/lib/utils/cn";
import type { CheckinDayEntry } from "@/components/checkins/checkin-calendar";
import { CheckinDayModal } from "@/components/checkins/checkin-day-modal";

interface CheckinCalendarGridProps {
  days: Date[];
  monthStart: Date;
  checkinsByDay: Record<string, CheckinDayEntry>;
  today: Date;
}

export function CheckinCalendarGrid({
  days,
  monthStart,
  checkinsByDay,
  today,
}: CheckinCalendarGridProps) {
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const selectedEntry = selectedDayKey ? checkinsByDay[selectedDayKey] : null;

  return (
    <>
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
          const multipleCheckins = entry && entry.count > 1;
          const isClickable = hasCheckin && entry.checkins.length > 0;

          const cellClass = cn(
            "relative aspect-square flex items-center justify-center rounded-lg text-xs overflow-hidden",
            isToday && "bg-primary text-white font-semibold ring-2 ring-primary ring-offset-1",
            !isToday && hasCheckin && !imageUrl && "bg-primary/15 text-primary font-medium",
            !isToday && !hasCheckin && "text-muted",
            isClickable && "cursor-pointer hover:opacity-90 active:scale-95 transition-all",
          );

          const content = imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className={cn(
                  "h-full w-full object-cover rounded-lg",
                  isToday && "opacity-80",
                )}
              />
              {isToday && (
                <span className="absolute inset-0 flex items-center justify-center font-semibold text-white text-sm drop-shadow-md">
                  {format(day, "d")}
                </span>
              )}
            </>
          ) : (
            format(day, "d")
          );

          const multipleBadge = multipleCheckins && (
            <span
              className={cn(
                "absolute bottom-0.5 right-0.5 flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-bold leading-none",
                isToday && !imageUrl
                  ? "bg-white/25 text-white"
                  : "bg-black/60 text-white",
              )}
            >
              <Images className="h-2.5 w-2.5" />
              {entry.count}
            </span>
          );

          if (isClickable) {
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDayKey(key)}
                className={cellClass}
                aria-label={`Ver ${entry.count} check-in${entry.count > 1 ? "s" : ""} de ${format(day, "d 'de' MMMM", { locale: ptBR })}`}
              >
                {content}
                {multipleBadge}
              </button>
            );
          }

          return (
            <div key={key} className={cellClass}>
              {content}
            </div>
          );
        })}
      </div>

      {selectedDayKey && selectedEntry && (
        <CheckinDayModal
          date={new Date(selectedDayKey + "T12:00:00")}
          checkins={selectedEntry.checkins}
          onClose={() => setSelectedDayKey(null)}
        />
      )}
    </>
  );
}
