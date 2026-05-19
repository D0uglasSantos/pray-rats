import { startOfDay } from "date-fns";

export function calculateStreakFromCheckinDates(
  checkedInAts: string[],
  referenceDate: Date = new Date(),
): number {
  if (!checkedInAts.length) return 0;

  const uniqueDays = new Set<string>();
  for (const checkedInAt of checkedInAts) {
    uniqueDays.add(startOfDay(new Date(checkedInAt)).toISOString());
  }

  const sortedDays = Array.from(uniqueDays).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );

  let streak = 0;
  const today = startOfDay(referenceDate);
  let expected = today;

  for (const dayStr of sortedDays) {
    const day = new Date(dayStr);
    if (day.getTime() === expected.getTime()) {
      streak++;
      expected = new Date(expected);
      expected.setDate(expected.getDate() - 1);
    } else if (
      streak === 0 &&
      day.getTime() ===
        startOfDay(new Date(referenceDate.getTime() - 86400000)).getTime()
    ) {
      streak++;
      expected = new Date(day);
      expected.setDate(expected.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
