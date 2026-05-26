import { describe, it, expect } from "vitest";
import { getDailyQuote } from "@/lib/constants/daily-quotes";

describe("getDailyQuote", () => {
  it("returns a quote for a given date", () => {
    const quote = getDailyQuote(new Date("2026-01-01"));
    expect(quote.text).toBeTruthy();
    expect(quote.source).toBeTruthy();
    expect(["saint", "bible"]).toContain(quote.type);
  });

  it("returns different quotes for different days", () => {
    const q1 = getDailyQuote(new Date("2026-03-01"));
    const q2 = getDailyQuote(new Date("2026-06-15"));
    expect(q1.text).toBeTruthy();
    expect(q2.text).toBeTruthy();
  });
});
