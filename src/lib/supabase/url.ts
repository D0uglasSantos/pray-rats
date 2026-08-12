/**
 * URL base do projeto Supabase (sem /rest/v1 nem barra final).
 * Settings → API → Project URL.
 */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada.");
  }

  let url = raw.replace(/\/+$/, "");
  // Erro comum: colar a URL do PostgREST (/rest/v1) em vez da Project URL
  url = url.replace(/\/rest\/v1$/i, "");

  return url;
}
