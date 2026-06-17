import { test as setup, expect } from "@playwright/test";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import {
  provisionE2eUser,
  type E2eCredentials,
} from "./helpers/supabase-admin";

const authFile = path.join("playwright", ".auth", "user.json");
const credentialsFile = path.join("playwright", ".auth", "credentials.json");

setup.describe.configure({ mode: "serial" });

setup("provision test user", async () => {
  setup.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY ausente — testes autenticados ignorados",
  );

  await provisionE2eUser();
});

setup("authenticate", async ({ page }) => {
  setup.skip(
    !process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY ausente — testes autenticados ignorados",
  );

  const raw = await readFile(credentialsFile, "utf8");
  const credentials = JSON.parse(raw) as E2eCredentials;

  await page.goto("/login");
  await page.getByLabel("E-mail").fill(credentials.email);
  await page.getByLabel("Senha").fill(credentials.password);
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.waitForURL("**/onboarding", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Bem-vindo à jornada/i })).toBeVisible();

  await mkdir(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
