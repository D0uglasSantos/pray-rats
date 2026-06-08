import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service role — apenas para operações server-side
 * que precisam bypassar RLS (ex.: ler push_subscriptions de outros usuários).
 * Nunca importar em componentes client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY não configurada. Necessária para envio de push.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
