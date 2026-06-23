import type { Page } from "@playwright/test";

export async function ensureUserHasGroup(page: Page): Promise<void> {
  await page.goto("/home");
  await page.waitForURL(/\/(home|onboarding)/, { timeout: 30_000 });

  if (!page.url().includes("/onboarding")) return;

  const groupName = `Grupo Tour E2E ${Date.now()}`;

  await page.goto("/groups/create");
  await page.getByLabel("Nome do grupo").fill(groupName);
  await page.getByRole("button", { name: "Continuar" }).click();

  await page.getByText(/Passo 2 de 2/i).waitFor({ timeout: 15_000 });
  await page.getByRole("button", { name: "Criar grupo" }).click();

  await page.waitForURL("**/home", { timeout: 30_000 });
  await page.getByText(groupName).waitFor({ timeout: 15_000 });
}
