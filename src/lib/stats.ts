import { startOfDay } from "date-fns";

export interface CheckinForStats {
  points: number;
  checked_in_at: string;
  activity_type?: { name?: string } | null;
}

export function computeUserStatsFromCheckins(
  checkins: CheckinForStats[],
  referenceDate: Date = new Date(),
) {
  const totalCheckins = checkins.length;
  const totalPoints = checkins.reduce((s, c) => s + c.points, 0);

  const activityCounts: Record<string, number> = {};
  for (const c of checkins) {
    const name = c.activity_type?.name ?? "Outros";
    activityCounts[name] = (activityCounts[name] ?? 0) + 1;
  }

  const topActivity = Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0];

  const monthStart = new Date(referenceDate);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const daysThisMonth = new Set<string>();
  for (const c of checkins) {
    const d = new Date(c.checked_in_at);
    if (d >= monthStart) {
      daysThisMonth.add(startOfDay(d).toISOString());
    }
  }

  return {
    totalCheckins,
    totalPoints,
    daysThisMonth: daysThisMonth.size,
    topActivity: topActivity
      ? { name: topActivity[0], count: topActivity[1] }
      : null,
  };
}

export function buildRanking(
  entries: {
    user_id: string;
    name: string;
    avatar_url: string | null;
    points: number;
  }[],
) {
  const aggregated = new Map<
    string,
    { user_id: string; name: string; avatar_url: string | null; total_points: number; total_checkins: number }
  >();

  for (const entry of entries) {
    const current = aggregated.get(entry.user_id);
    if (current) {
      current.total_points += entry.points;
      current.total_checkins += 1;
    } else {
      aggregated.set(entry.user_id, {
        user_id: entry.user_id,
        name: entry.name,
        avatar_url: entry.avatar_url,
        total_points: entry.points,
        total_checkins: 1,
      });
    }
  }

  return Array.from(aggregated.values()).sort(
    (a, b) => b.total_points - a.total_points,
  );
}

export function getRankingPosition(
  ranking: { user_id: string }[],
  userId: string,
): number | null {
  const index = ranking.findIndex((r) => r.user_id === userId);
  return index >= 0 ? index + 1 : null;
}
