type ErrorMeta = Record<string, unknown>;

function serializeError(error: unknown): { message: string; name?: string } {
  if (error instanceof Error) {
    return { message: error.message, name: error.name };
  }
  return { message: String(error) };
}

/** Log estruturado para produção (Vercel Logs / futuro Sentry). */
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
