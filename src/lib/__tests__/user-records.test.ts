import { describe, it, expect } from "vitest";
import { computeUserRecords, computeBestStreak } from "@/lib/user-records";

describe("computeUserRecords", () => {
  it("computes day vs night checkins", () => {
    const records = computeUserRecords([
      { checked_in_at: "2026-01-01T10:00:00Z", duration_minutes: null, distance_km: null, points: 5 },
      { checked_in_at: "2026-01-01T22:00:00Z", duration_minutes: null, distance_km: null, points: 5 },
    ]);

    expect(records.dayCheckins + records.nightCheckins).toBe(2);
  });

  it("finds longest duration and distance", () => {
    const records = computeUserRecords([
      { checked_in_at: "2026-01-01T10:00:00Z", duration_minutes: 30, distance_km: 5, points: 10 },
      { checked_in_at: "2026-01-02T10:00:00Z", duration_minutes: 60, distance_km: 10.5, points: 10 },
    ]);

    expect(records.longestDuration).toBe(60);
    expect(records.longestDistance).toBe(10.5);
    expect(records.totalDistance).toBe(15.5);
  });
});

describe("computeBestStreak", () => {
  it("finds best consecutive day streak", () => {
    const streak = computeBestStreak([
      "2026-01-01T10:00:00Z",
      "2026-01-02T10:00:00Z",
      "2026-01-03T10:00:00Z",
      "2026-01-05T10:00:00Z",
    ]);
    expect(streak).toBe(3);
  });
});
