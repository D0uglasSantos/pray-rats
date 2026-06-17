import { test, expect } from "@playwright/test";

test.describe("Rotas públicas", () => {
  test("landing page carrega", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Entrar/i }).first()).toBeVisible();
    await expect(page.getByText("PrayRats").first()).toBeVisible();
  });

  test("página de login carrega", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Bem-vindo de volta/i })).toBeVisible();
    await expect(page.getByLabel("E-mail")).toBeVisible();
    await expect(page.getByLabel("Senha")).toBeVisible();
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
  });

  test("página de cadastro carrega", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /Criar conta/i })).toBeVisible();
    await expect(page.getByLabel("Nome")).toBeVisible();
    await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();
  });

  test("esqueci senha carrega", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("button", { name: /Enviar link/i })).toBeVisible();
  });

  test("login inválido exibe erro", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("E-mail").fill("invalido@pray-rats.test");
    await page.getByLabel("Senha").fill("senhaerrada123");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("E-mail ou senha incorretos.").first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
