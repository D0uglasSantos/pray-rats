import type { ActivityType } from "@/types/database";

export interface CheckinCounts {
  daily: number;
  weekly: number;
}

export function evaluateCheckinLimits(
  activity: Pick<ActivityType, "name" | "points" | "daily_limit" | "weekly_limit">,
  counts: CheckinCounts,
): { allowed: boolean; points: number; message?: string } {
  if (activity.daily_limit != null && counts.daily >= activity.daily_limit) {
    return {
      allowed: false,
      points: 0,
      message: `Limite diário atingido para "${activity.name}" (${activity.daily_limit}/dia).`,
    };
  }

  if (activity.weekly_limit != null && counts.weekly >= activity.weekly_limit) {
    return {
      allowed: false,
      points: 0,
      message: `Limite semanal atingido para "${activity.name}" (${activity.weekly_limit}/semana).`,
    };
  }

  return { allowed: true, points: activity.points };
}

export function filterPublicFeedCheckins<
  T extends { visibility: string; status: string },
>(checkins: T[]): T[] {
  return checkins.filter((c) => c.visibility === "public" && c.status === "valid");
}

export function sumPoints(checkins: { points: number }[]): number {
  return checkins.reduce((sum, c) => sum + c.points, 0);
}
