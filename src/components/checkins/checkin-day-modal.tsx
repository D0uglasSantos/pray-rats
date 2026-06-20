"use client";

import { useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckinImageButton } from "@/components/checkins/checkin-image-button";
import { getCheckinImageDisplayUrl } from "@/lib/checkin-image-url";
import type { CalendarCheckin } from "@/components/checkins/checkin-calendar";

interface CheckinDayModalProps {
  date: Date;
  checkins: CalendarCheckin[];
  onClose: () => void;
}

export function CheckinDayModal({ date, checkins, onClose }: CheckinDayModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const sorted = [...checkins].sort(
    (a, b) => new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime(),
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Check-ins do dia"
    >
      <div
        className="w-full max-h-[85vh] sm:max-w-md bg-surface rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground capitalize">
            {format(date, "d 'de' MMMM", { locale: ptBR })}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted hover:text-foreground hover:bg-surface-secondary transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(85vh-56px)]">
          {sorted.map((checkin) => {
            const activityName =
              Array.isArray(checkin.activity_type)
                ? checkin.activity_type[0]?.name
                : checkin.activity_type?.name ?? "Atividade";

            return (
              <div
                key={checkin.id}
                className="rounded-xl border border-border p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge variant="primary" className="mb-1">
                      {activityName}
                    </Badge>
                    <p className="font-semibold text-foreground">{checkin.title}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {format(new Date(checkin.checked_in_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <Badge variant="accent" className="shrink-0">
                    +{checkin.points}
                  </Badge>
                </div>

                {checkin.image_url && (
                  <CheckinImageButton
                    src={getCheckinImageDisplayUrl(checkin.image_url)}
                    alt={`Foto de ${checkin.title}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
