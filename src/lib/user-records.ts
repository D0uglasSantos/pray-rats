import { format, getHours, getMonth, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateStreakFromCheckinDates } from "@/lib/streak";

export interface CheckinForRecords {
  checked_in_at: string;
  duration_minutes: number | null;
  distance_km: number | null;
  points: number;
}

export interface UserRecords {
  bestStreak: number;
  currentStreak: number;
  mostActiveWeekday: { name: string; count: number } | null;
  mostActiveHour: { hour: number; count: number } | null;
  dayCheckins: number;
  nightCheckins: number;
  bestMonth: { name: string; count: number; points: number } | null;
  longestDuration: number | null;
  longestDistance: number | null;
  totalDistance: number;
}

const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 18;
}

export function computeBestStreak(checkedInAts: string[]): number {
  if (!checkedInAts.length) return 0;

  const uniqueDays = Array.from(
    new Set(checkedInAts.map((d) => startOfDay(new Date(d)).toISOString())),
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  let best = 0;
  let current = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]);
    const curr = new Date(uniqueDays[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 1) {
      current++;
    } else {
      best = Math.max(best, current);
      current = 1;
    }
  }

  return Math.max(best, current);
}

export function computeUserRecords(
  checkins: CheckinForRecords[],
  referenceDate: Date = new Date(),
): UserRecords {
  const checkedInAts = checkins.map((c) => c.checked_in_at);
  const bestStreak = computeBestStreak(checkedInAts);
  const currentStreak = calculateStreakFromCheckinDates(checkedInAts, referenceDate);

  const weekdayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);
  const monthCounts = new Map<number, { count: number; points: number }>();

  let dayCheckins = 0;
  let nightCheckins = 0;
  let longestDuration: number | null = null;
  let longestDistance: number | null = null;
  let totalDistance = 0;

  for (const checkin of checkins) {
    const date = new Date(checkin.checked_in_at);
    const weekday = date.getDay();
    const hour = getHours(date);
    const month = getMonth(date);

    weekdayCounts[weekday]++;
    hourCounts[hour]++;

    if (isDaytime(hour)) {
      dayCheckins++;
    } else {
      nightCheckins++;
    }

    const monthData = monthCounts.get(month) ?? { count: 0, points: 0 };
    monthData.count++;
    monthData.points += checkin.points;
    monthCounts.set(month, monthData);

    if (checkin.duration_minutes != null) {
      longestDuration =
        longestDuration == null
          ? checkin.duration_minutes
          : Math.max(longestDuration, checkin.duration_minutes);
    }

    if (checkin.distance_km != null) {
      totalDistance += checkin.distance_km;
      longestDistance =
        longestDistance == null
          ? checkin.distance_km
          : Math.max(longestDistance, checkin.distance_km);
    }
  }

  const maxWeekdayCount = Math.max(...weekdayCounts, 0);
  const maxWeekdayIndex =
    maxWeekdayCount > 0 ? weekdayCounts.indexOf(maxWeekdayCount) : -1;

  const maxHourCount = Math.max(...hourCounts, 0);
  const maxHour = maxHourCount > 0 ? hourCounts.indexOf(maxHourCount) : -1;

  let bestMonth: UserRecords["bestMonth"] = null;
  for (const [month, data] of monthCounts) {
    if (!bestMonth || data.count > bestMonth.count) {
      bestMonth = {
        name: MONTH_NAMES[month],
        count: data.count,
        points: data.points,
      };
    }
  }

  return {
    bestStreak,
    currentStreak,
    mostActiveWeekday:
      maxWeekdayIndex >= 0
        ? { name: WEEKDAY_NAMES[maxWeekdayIndex], count: maxWeekdayCount }
        : null,
    mostActiveHour:
      maxHour >= 0 ? { hour: maxHour, count: maxHourCount } : null,
    dayCheckins,
    nightCheckins,
    bestMonth,
    longestDuration,
    longestDistance,
    totalDistance,
  };
}

export function formatHourLabel(hour: number): string {
  return format(new Date(2000, 0, 1, hour), "HH'h'", { locale: ptBR });
}
