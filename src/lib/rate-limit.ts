import { createAdminClient } from "@/lib/supabase/admin";

const LIMITS = {
  signIn: { maxAttempts: 10, windowSeconds: 15 * 60 },
  signUp: { maxAttempts: 5, windowSeconds: 60 * 60 },
  resetPassword: { maxAttempts: 5, windowSeconds: 60 * 60 },
} as const;

export type AuthRateLimitAction = keyof typeof LIMITS;

function normalizeKey(action: AuthRateLimitAction, identifier: string): string {
  return `${action}:${identifier.trim().toLowerCase()}`;
}

/**
 * Retorna false se o limite foi excedido.
 * Se a migration 013 não estiver aplicada, permite a ação (fail-open).
 */
export async function checkAuthRateLimit(
  action: AuthRateLimitAction,
  identifier: string,
): Promise<boolean> {
  const { maxAttempts, windowSeconds } = LIMITS[action];
  const rateKey = normalizeKey(action, identifier);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_auth_rate_limit", {
      p_key: rateKey,
      p_max_attempts: maxAttempts,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[rate-limit] RPC indisponível — migration 013 aplicada?", error.message);
      }
      return true;
    }

    return data === true;
  } catch {
    return true;
  }
}

export function authRateLimitMessage(action: AuthRateLimitAction): string {
  switch (action) {
    case "signIn":
      return "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
    case "signUp":
      return "Muitas tentativas de cadastro. Tente novamente mais tarde.";
    case "resetPassword":
      return "Muitas solicitações de redefinição. Aguarde antes de tentar de novo.";
  }
}
