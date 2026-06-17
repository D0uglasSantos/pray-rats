import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getWebPushStatusCode,
  isDeadPushSubscription,
  isTransientPushFailure,
  sendPushWithRetry,
} from "@/lib/push-delivery";

describe("push-delivery", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detecta statusCode do web-push", () => {
    expect(getWebPushStatusCode({ statusCode: 410 })).toBe(410);
    expect(getWebPushStatusCode(new Error("x"))).toBeUndefined();
  });

  it("identifica subscription morta", () => {
    expect(isDeadPushSubscription(410)).toBe(true);
    expect(isDeadPushSubscription(503)).toBe(false);
  });

  it("identifica falha transitória", () => {
    expect(isTransientPushFailure(503)).toBe(true);
    expect(isTransientPushFailure(410)).toBe(false);
    expect(isTransientPushFailure(401)).toBe(false);
  });

  it("faz retry em falha transitória e depois sucede", async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce(undefined);

    const result = await sendPushWithRetry(send, { baseDelayMs: 1 });
    expect(result.ok).toBe(true);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("não faz retry em 410", async () => {
    const send = vi.fn().mockRejectedValue({ statusCode: 410 });
    const result = await sendPushWithRetry(send, { baseDelayMs: 1 });
    expect(result.ok).toBe(false);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
