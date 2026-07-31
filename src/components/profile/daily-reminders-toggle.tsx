"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getReminderPreferences,
  updateReminderPreferences,
} from "@/actions/reminders";
import { useToast } from "@/components/ui/toast";
import { Card } from "@/components/ui/card";
import { AlarmClock, AlarmClockOff } from "lucide-react";

function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/Sao_Paulo";
  }
}

export function DailyRemindersToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [pushActive, setPushActive] = useState<boolean | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  useEffect(() => {
    async function syncState() {
      const prefs = await getReminderPreferences();
      if (!prefs) {
        setEnabled(false);
        return;
      }

      setEnabled(prefs.enabled);

      // Mantém o fuso salvo em dia (ex.: viagens, horário de verão)
      const browserTimeZone = getBrowserTimeZone();
      if (prefs.enabled && prefs.timezone !== browserTimeZone) {
        startTransition(async () => {
          await updateReminderPreferences({
            enabled: true,
            timezone: browserTimeZone,
          });
        });
      }

      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setPushActive(Boolean(subscription));
        } else {
          setPushActive(false);
        }
      } catch {
        setPushActive(false);
      }
    }

    void syncState();
  }, []);

  function toggle() {
    if (enabled === null) return;
    const next = !enabled;
    setEnabled(next);

    startTransition(async () => {
      const result = await updateReminderPreferences({
        enabled: next,
        timezone: getBrowserTimeZone(),
      });

      if (result.success) {
        showToast(
          next
            ? "Lembretes diários ativados: manhã, tarde e noite."
            : "Lembretes diários desativados.",
          next ? "success" : "info",
        );
      } else {
        setEnabled(!next);
        showToast(result.error, "error");
      }
    });
  }

  const isOn = enabled === true;
  const StatusIcon = isOn ? AlarmClock : AlarmClockOff;

  return (
    <Card padding="sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <StatusIcon className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Lembretes diários</p>
            <p className="text-xs text-muted">
              3 lembretes por dia (manhã, tarde e noite) para marcar seus feitos
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          aria-label="Ativar lembretes diários"
          disabled={isPending || enabled === null}
          onClick={toggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            isOn ? "bg-primary" : "bg-border"
          } ${isPending || enabled === null ? "opacity-50" : ""}`}
        >
          <span
            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
              isOn ? "left-5" : "left-0.5"
            }`}
          />
        </button>
      </div>
      {isOn && pushActive === false && (
        <p className="text-xs text-yellow-600 mt-2">
          Ative os alertas no celular acima para receber os lembretes.
        </p>
      )}
    </Card>
  );
}
