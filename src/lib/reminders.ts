export type ReminderSlot = "morning" | "afternoon" | "evening";

export interface ReminderSlotConfig {
  slot: ReminderSlot;
  hour: number;
  minute: number;
  title: string;
  body: string;
}

export const REMINDER_LINK = "/check-in";
export const DEFAULT_TIMEZONE = "America/Sao_Paulo";

/** Janela após o horário alvo em que o lembrete ainda pode ser enviado. */
export const REMINDER_WINDOW_MINUTES = 60;

export const REMINDER_SLOTS: ReminderSlotConfig[] = [
  {
    slot: "morning",
    hour: 9,
    minute: 0,
    title: "Bom dia!",
    body: "Comece o dia marcando seus feitos.",
  },
  {
    slot: "afternoon",
    hour: 15,
    minute: 0,
    title: "Lembrete da tarde",
    body: "Já marcou seus feitos de hoje? Ainda dá tempo.",
  },
  {
    slot: "evening",
    hour: 20,
    minute: 0,
    title: "Lembrete da noite",
    body: "Antes de dormir, registre os feitos do seu dia.",
  },
];

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Minutos desde meia-noite no fuso informado, ou null se o fuso for inválido. */
export function getLocalMinutes(now: Date, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value);
    const minute = Number(parts.find((p) => p.type === "minute")?.value);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
    return (hour % 24) * 60 + minute;
  } catch {
    return null;
  }
}

/** Data local no formato YYYY-MM-DD, ou null se o fuso for inválido. */
export function getLocalDateString(now: Date, timeZone: string): string | null {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return null;
  }
}

/** Slot devido no momento, considerando a janela de tolerância após o alvo. */
export function getDueReminderSlot(
  localMinutes: number,
  windowMinutes: number = REMINDER_WINDOW_MINUTES,
): ReminderSlotConfig | null {
  for (const config of REMINDER_SLOTS) {
    const target = config.hour * 60 + config.minute;
    if (localMinutes >= target && localMinutes < target + windowMinutes) {
      return config;
    }
  }
  return null;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );
  return asUtc - date.getTime();
}

function zonedLocalToUtc(local: string, timeZone: string): Date {
  const guess = new Date(`${local}Z`);
  const offset = getTimeZoneOffsetMs(guess, timeZone);
  const utc = new Date(guess.getTime() - offset);
  // Segunda passada cobre transições de horário de verão entre o chute e o resultado
  const refined = getTimeZoneOffsetMs(utc, timeZone);
  return refined === offset ? utc : new Date(guess.getTime() - refined);
}

/**
 * Intervalo UTC que cobre o dia local corrente no fuso informado.
 * Lida com dias de 23h/25h em transições de horário de verão.
 */
export function getLocalDayRangeUtc(
  now: Date,
  timeZone: string,
): { start: Date; end: Date; localDate: string } | null {
  const localDate = getLocalDateString(now, timeZone);
  if (!localDate) return null;

  const [year, month, day] = localDate.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1))
    .toISOString()
    .slice(0, 10);

  return {
    start: zonedLocalToUtc(`${localDate}T00:00:00`, timeZone),
    end: zonedLocalToUtc(`${nextDay}T00:00:00`, timeZone),
    localDate,
  };
}
