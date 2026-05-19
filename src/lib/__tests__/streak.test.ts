import { describe, it, expect } from "vitest";
import { calculateStreakFromCheckinDates } from "@/lib/streak";

describe("calculateStreakFromCheckinDates", () => {
  const ref = new Date("2026-05-19T12:00:00");

  it("retorna 0 sem check-ins", () => {
    expect(calculateStreakFromCheckinDates([], ref)).toBe(0);
  });

  it("conta sequência incluindo hoje", () => {
    const dates = [
      "2026-05-19T08:00:00",
      "2026-05-18T20:00:00",
      "2026-05-17T07:00:00",
    ];
    expect(calculateStreakFromCheckinDates(dates, ref)).toBe(3);
  });

  it("conta múltiplos check-ins no mesmo dia como 1 dia", () => {
    const dates = [
      "2026-05-19T08:00:00",
      "2026-05-19T20:00:00",
      "2026-05-18T07:00:00",
    ];
    expect(calculateStreakFromCheckinDates(dates, ref)).toBe(2);
  });

  it("permite streak começando de ontem se hoje não teve check-in", () => {
    const dates = ["2026-05-18T08:00:00", "2026-05-17T08:00:00"];
    expect(calculateStreakFromCheckinDates(dates, ref)).toBe(2);
  });

  it("interrompe streak quando há gap", () => {
    const dates = [
      "2026-05-19T08:00:00",
      "2026-05-17T08:00:00", // pulou dia 18
    ];
    expect(calculateStreakFromCheckinDates(dates, ref)).toBe(1);
  });

  it("retorna 0 se último check-in foi há 2+ dias", () => {
    const dates = ["2026-05-15T08:00:00"];
    expect(calculateStreakFromCheckinDates(dates, ref)).toBe(0);
  });
});
