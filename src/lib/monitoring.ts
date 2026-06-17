import * as Sentry from "@sentry/nextjs";

type ErrorMeta = Record<string, unknown>;

function serializeError(error: unknown): { message: string; name?: string } {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: String(error) };
}

/** Log estruturado + Sentry (quando SENTRY_DSN estiver configurado). */
export function logServerError(
  scope: string,
  error: unknown,
  meta: ErrorMeta = {},
): void {
  console.error(
    JSON.stringify({
      source: "server",
      scope,
      error: serializeError(error),
      ...meta,
      ts: new Date().toISOString(),
    }),
  );

  if (process.env.SENTRY_DSN) {
    Sentry.withScope((sentryScope) => {
      sentryScope.setTag("scope", scope);
      for (const [key, value] of Object.entries(meta)) {
        sentryScope.setExtra(key, value);
      }
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(String(error), "error");
      }
    });
  }
}

export function logServerEvent(
  scope: string,
  event: string,
  meta: ErrorMeta = {},
): void {
  console.error(
    JSON.stringify({
      source: "server",
      scope,
      event,
      ...meta,
      ts: new Date().toISOString(),
    }),
  );
}
