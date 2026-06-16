/** URL base do app, com correção de typos comuns em NEXT_PUBLIC_APP_URL */
export function getAppUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  // Corrige erros de digitação frequentes no protocolo
  url = url.replace(/^hhtps:\/\//i, "https://");
  url = url.replace(/^htps:\/\//i, "https://");
  url = url.replace(/^httpss:\/\//i, "https://");

  // Remove barra final
  url = url.replace(/\/$/, "");

  return url;
}

export function appInviteUrl(inviteCode: string): string {
  return `${getAppUrl()}/invite/${inviteCode}`;
}

/** URL de callback OAuth / e-mail de auth com destino após login. */
export function getAuthCallbackUrl(nextPath: string): string {
  const path = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${getAppUrl()}/auth/callback?next=${encodeURIComponent(path)}`;
}

/** Redirect URLs recomendadas no Supabase (Authentication → URL Configuration). */
export function getSupabaseRedirectUrls(): string[] {
  const base = getAppUrl();
  return [`${base}/auth/callback`, `${base}/reset-password`];
}
