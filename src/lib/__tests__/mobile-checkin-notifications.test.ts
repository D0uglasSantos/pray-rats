import { describe, expect, it } from "vitest";
import {
  parseMobileCheckinNotificationBody,
  readBearerToken,
} from "@/lib/mobile-checkin-notifications";

const firstId = "123e4567-e89b-42d3-a456-426614174000";
const secondId = "123e4567-e89b-42d3-a456-426614174001";

describe("mobile check-in notifications", () => {
  it("valida e remove IDs duplicados", () => {
    expect(
      parseMobileCheckinNotificationBody({ checkinIds: [firstId, firstId, secondId] }),
    ).toEqual([firstId, secondId]);
  });

  it("rejeita payload vazio ou com ID inválido", () => {
    expect(parseMobileCheckinNotificationBody({ checkinIds: [] })).toBeNull();
    expect(parseMobileCheckinNotificationBody({ checkinIds: ["invalid"] })).toBeNull();
  });

  it("lê somente um bearer token válido", () => {
    expect(
      readBearerToken(new Request("https://pray-rats.vercel.app", {
        headers: { authorization: "Bearer access-token" },
      })),
    ).toBe("access-token");
    expect(readBearerToken(new Request("https://pray-rats.vercel.app"))).toBeNull();
  });
});
