import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type E2eCredentials = {
  email: string;
  password: string;
  userId: string;
};

const CREDENTIALS_PATH = path.join("playwright", ".auth", "credentials.json");

export async function provisionE2eUser(): Promise<E2eCredentials | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket as never },
  });

  const email = `e2e-${Date.now()}@pray-rats.test`;
  const password = `E2eTest${Date.now()}!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Usuário E2E" },
  });

  if (error || !data.user) {
    throw new Error(`Falha ao criar usuário E2E: ${error?.message ?? "unknown"}`);
  }

  const credentials: E2eCredentials = {
    email,
    password,
    userId: data.user.id,
  };

  await mkdir(path.dirname(CREDENTIALS_PATH), { recursive: true });
  await writeFile(CREDENTIALS_PATH, JSON.stringify(credentials), "utf8");

  return credentials;
}

export async function cleanupE2eUser(userId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket as never },
  });

  await admin.auth.admin.deleteUser(userId);
}
