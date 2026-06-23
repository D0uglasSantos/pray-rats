import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.describe("Fluxos autenticados", () => {
  test("onboarding oferece criar ou entrar em grupo", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page.getByText("Criar grupo")).toBeVisible();
    await expect(page.getByText("Entrar em grupo")).toBeVisible();
  });

  test("criar grupo e abrir fluxo de check-in", async ({ page }) => {
    const groupName = `Grupo E2E ${Date.now()}`;

    await page.goto("/groups/create");
    await page.getByLabel("Nome do grupo").fill(groupName);
    await page.getByRole("button", { name: "Continuar" }).click();

    await expect(page.getByText(/Passo 2 de 2/i)).toBeVisible();
    await expect(page.getByText(/Atividades do check-in/i)).toBeVisible();
    await page.getByRole("button", { name: "Criar grupo" }).click();

    await page.waitForURL("**/home", { timeout: 30_000 });
    await expect(page.getByText(groupName)).toBeVisible({ timeout: 15_000 });

    await page.goto("/check-in");
    await expect(page.getByText(/Passo 1 de 2/i)).toBeVisible();
    await page.getByRole("button", { name: /Continuar sem foto/i }).click();

    await expect(page.getByText(/Passo 2 de 2/i)).toBeVisible();
    await expect(page.getByText(/Tipo de atividade/i)).toBeVisible();
  });

  test("feed e ranking respondem após grupo criado", async ({ page }) => {
    await page.goto("/feed");
    await expect(page).toHaveURL(/\/feed/);

    await page.goto("/ranking");
    await expect(page).toHaveURL(/\/ranking/);
  });
});
