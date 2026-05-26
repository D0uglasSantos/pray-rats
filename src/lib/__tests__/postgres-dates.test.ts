import { describe, it, expect } from "vitest";
import {
  getPostgresWeekStartISO,
  getPostgresMonthStartISO,
} from "@/lib/postgres-dates";

describe("postgres-dates", () => {
  it("aligns week start with PostgreSQL date_trunc (UTC Monday midnight)", () => {
    const weekStart = getPostgresWeekStartISO(new Date("2026-05-26T12:00:00Z"));
    expect(weekStart).toBe("2026-05-25T00:00:00.000Z");
  });

  it("aligns month start with PostgreSQL date_trunc (UTC first day)", () => {
    const monthStart = getPostgresMonthStartISO(new Date("2026-05-26T12:00:00Z"));
    expect(monthStart).toBe("2026-05-01T00:00:00.000Z");
  });
});
