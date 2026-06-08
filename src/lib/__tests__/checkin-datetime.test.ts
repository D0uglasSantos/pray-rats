import { describe, expect, it } from "vitest";
import {
  parseCheckedInAtInput,
  toDatetimeLocalValue,
  validateCheckinDatetime,
} from "@/lib/checkin-datetime";

describe("checkin-datetime", () => {
  it("rejects future datetimes", () => {
    const future = new Date(Date.now() + 60_000);
    expect(validateCheckinDatetime(future)).toBe("A data não pode ser no futuro.");
  });

  it("parses datetime-local values to ISO", () => {
    const value = toDatetimeLocalValue(new Date("2026-06-08T14:30:00"));
    const result = parseCheckedInAtInput(value);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.iso).toBeTruthy();
    }
  });
});
