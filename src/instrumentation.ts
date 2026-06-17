export async function register() {
  // Reservado para Sentry ou outros APM quando SENTRY_DSN estiver configurado.
}

export const onRequestError = async (
  error: Error,
  request: { path: string; method: string },
) => {
  console.error(
    JSON.stringify({
      source: "server",
      scope: "onRequestError",
      path: request.path,
      method: request.method,
      error: { message: error.message, name: error.name },
      ts: new Date().toISOString(),
    }),
  );
};
