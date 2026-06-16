import { describe, it, expect } from "vitest";
import { STATS_LOOKBACK_DAYS, STREAK_LOOKBACK_DAYS, statsLookbackDate } from "@/lib/stats-lookback";

describe("statsLookbackDate", () => {
  it("retorna data ~395 dias antes da referência", () => {
    const ref = new Date("2026-06-15T12:00:00Z");
    const lookback = statsLookbackDate(ref);
    const diffDays = Math.round(
      (ref.getTime() - lookback.getTime()) / (1000 * 60 * 60 * 24),
    );
    expect(diffDays).toBe(STATS_LOOKBACK_DAYS);
  });

  it("STREAK_LOOKBACK_DAYS cobre pelo menos um ano", () => {
    expect(STREAK_LOOKBACK_DAYS).toBeGreaterThanOrEqual(365);
  });
});
