import { describe, expect, it, vi } from "vitest";
import {
  chunkExpoItems,
  ExpoPushRequestError,
  postExpoPushJson,
} from "@/lib/expo-push-api";
import { evaluateExpoReceiptBatch } from "@/lib/process-expo-push-receipts";

describe("Expo Push API", () => {
  it("limita os lotes de envio ao tamanho informado", () => {
    const chunks = chunkExpoItems(Array.from({ length: 205 }, (_, index) => index), 100);

    expect(chunks.map((chunk) => chunk.length)).toEqual([100, 100, 5]);
  });

  it("repete requisições 429 e 5xx com backoff", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ data: { status: "ok" } }));
    const delays: number[] = [];
    const sleep = vi.fn(async (delayMs: number) => {
      delays.push(delayMs);
    });

    const result = await postExpoPushJson<{ data: { status: string } }>(
      "https://example.test/push",
      { ids: ["ticket"] },
      { fetcher, sleep },
    );

    expect(result.data.status).toBe("ok");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([250, 1_000]);
  });

  it("não repete erros HTTP definitivos", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 400 }));
    const sleep = vi.fn(async (delayMs: number) => {
      void delayMs;
    });

    await expect(
      postExpoPushJson("https://example.test/push", {}, { fetcher, sleep }),
    ).rejects.toBeInstanceOf(ExpoPushRequestError);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });
});

describe("Expo Push receipts", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");
  const tickets = [
    {
      receipt_id: "ok-ticket",
      device_id: "device-ok",
      attempts: 0,
      expires_at: "2026-08-28T12:00:00.000Z",
    },
    {
      receipt_id: "invalid-ticket",
      device_id: "device-invalid",
      attempts: 1,
      expires_at: "2026-08-28T12:00:00.000Z",
    },
    {
      receipt_id: "pending-ticket",
      device_id: "device-pending",
      attempts: 2,
      expires_at: "2026-08-28T12:00:00.000Z",
    },
  ];

  it("classifica entregas e desativa o token inválido", () => {
    const result = evaluateExpoReceiptBatch(
      tickets,
      {
        data: {
          "ok-ticket": { status: "ok" },
          "invalid-ticket": {
            status: "error",
            message: "Device is not registered",
            details: { error: "DeviceNotRegistered" },
          },
        },
      },
      now,
    );

    expect(result.counters).toEqual({ ok: 1, errors: 1, pending: 1, expired: 0 });
    expect([...result.invalidDeviceIds]).toEqual(["device-invalid"]);
    expect(result.updates.find((update) => update.receipt_id === "pending-ticket")).toMatchObject({
      status: "pending",
      attempts: 3,
      next_check_at: "2026-08-27T14:00:00.000Z",
    });
  });

  it("expira tickets ausentes após o limite de tentativas", () => {
    const result = evaluateExpoReceiptBatch(
      [{ ...tickets[0], receipt_id: "expired-ticket", attempts: 5 }],
      { data: {} },
      now,
    );

    expect(result.counters.expired).toBe(1);
    expect(result.updates[0]).toMatchObject({
      status: "expired",
      attempts: 6,
      next_check_at: null,
      checked_at: now.toISOString(),
    });
  });
});
