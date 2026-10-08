import { describe, expect, it } from "vitest";
import { isExpoPushToken } from "@/lib/send-expo-push-to-user";

describe("expo push delivery", () => {
  it("aceita apenas tokens Expo no formato esperado", () => {
    expect(isExpoPushToken("ExpoPushToken[abc123]")).toBe(true);
    expect(isExpoPushToken("ExponentPushToken[abc123]")).toBe(true);
    expect(isExpoPushToken("https://example.com/push")).toBe(false);
  });
});
