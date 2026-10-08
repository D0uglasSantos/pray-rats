import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "@/lib/supabase/url";

/**
 * Cliente Supabase com service role — apenas para operações server-side
 * que precisam bypassar RLS (ex.: ler push_subscriptions de outros usuários).
 * Nunca importar em componentes client.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Necessária para operações privilegiadas.",
    );
  }

  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
