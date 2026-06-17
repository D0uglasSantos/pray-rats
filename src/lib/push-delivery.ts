export type PushDeliveryResult =
  | { ok: true }
  | { ok: false; statusCode?: number; error: unknown };

const DEAD_SUBSCRIPTION_STATUSES = new Set([404, 410]);
const TRANSIENT_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export function getWebPushStatusCode(error: unknown): number | undefined {
  if (error && typeof error === "object" && "statusCode" in error) {
    const code = (error as { statusCode: unknown }).statusCode;
    return typeof code === "number" ? code : undefined;
  }
  return undefined;
}

export function isDeadPushSubscription(statusCode?: number): boolean {
  return statusCode !== undefined && DEAD_SUBSCRIPTION_STATUSES.has(statusCode);
}

export function isTransientPushFailure(statusCode?: number): boolean {
  if (statusCode === undefined) return true;
  if (isDeadPushSubscription(statusCode)) return false;
  if (statusCode >= 400 && statusCode < 500) return false;
  return TRANSIENT_STATUSES.has(statusCode) || statusCode >= 500;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendPushWithRetry(
  send: () => Promise<void>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<PushDeliveryResult> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 400;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await send();
      return { ok: true };
    } catch (error) {
      lastError = error;
      const statusCode = getWebPushStatusCode(error);

      if (isDeadPushSubscription(statusCode)) {
        return { ok: false, statusCode, error };
      }

      if (!isTransientPushFailure(statusCode) || attempt === maxAttempts) {
        return { ok: false, statusCode, error };
      }

      await sleep(baseDelayMs * attempt);
    }
  }

  return { ok: false, error: lastError };
}

export function logPushEvent(
  event: string,
  data: Record<string, unknown> = {},
): void {
  console.error(
    JSON.stringify({
      source: "push",
      event,
      ...data,
      ts: new Date().toISOString(),
    }),
  );
}

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_SUBJECT,
  );
}
