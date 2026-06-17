import { readFile } from "node:fs/promises";
import path from "node:path";
import { cleanupE2eUser, type E2eCredentials } from "./helpers/supabase-admin";

export default async function globalTeardown() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const raw = await readFile(
      path.join("playwright", ".auth", "credentials.json"),
      "utf8",
    );
    const credentials = JSON.parse(raw) as E2eCredentials;
    await cleanupE2eUser(credentials.userId);
  } catch {
    // credenciais não criadas
  }
}
