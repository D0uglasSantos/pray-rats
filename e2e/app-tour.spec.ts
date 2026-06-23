import { test, expect } from "@playwright/test";
import { ensureUserHasGroup } from "./helpers/ensure-group";

test.describe.configure({ mode: "serial" });

test.describe("App Tour (tutorial interativo)", () => {
  test.beforeEach(async ({ page }) => {
    await ensureUserHasGroup(page);
    await page.goto("/group");
  });

  test("home contém targets do tutorial", async ({ page }) => {
    await page.goto("/home");
    await expect(page.locator("[data-tour-id='home-stats']")).toBeVisible();
    await expect(page.locator("[data-tour-id='home-checkin-cta']")).toBeVisible();
    await expect(page.locator("[data-tour-id='active-group']")).toBeVisible();
    await expect(page.locator("[data-tour-id='nav-home']")).toBeVisible();
    await expect(page.locator("[data-tour-id='nav-group']")).toBeVisible();
    await expect(page.locator("[data-tour-id='nav-checkin']")).toBeVisible();
    await expect(page.locator("[data-tour-id='nav-ranking']")).toBeVisible();
    await expect(page.locator("[data-tour-id='nav-profile']")).toBeVisible();
  });

  test("perfil oferece reabrir o tutorial", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText("Ver tutorial do aplicativo")).toBeVisible();
    await expect(page.getByText("Ajuda")).toBeVisible();
  });

  test("replay via perfil navega para home com tour", async ({ page }) => {
    await page.goto("/profile");
    await page.getByText("Ver tutorial do aplicativo").click();
    await page.waitForURL("**/home**", { timeout: 15_000 });

    await expect(
      page.getByRole("dialog").filter({ hasText: "Bem-vindo ao PrayRats" }),
    ).toBeVisible({ timeout: 20_000 });
  });

  test("tutorial abre com diálogo acessível em replay", async ({ page }) => {
    await page.goto("/home?tour=replay");

    const dialog = page.getByRole("dialog").filter({ hasText: "Bem-vindo ao PrayRats" });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  test("avançar e voltar entre etapas no replay", async ({ page }) => {
    await page.goto("/home?tour=replay");

    const welcome = page.getByRole("dialog").filter({ hasText: "Bem-vindo ao PrayRats" });
    await expect(welcome).toBeVisible({ timeout: 15_000 });
    await welcome.getByRole("button", { name: "Começar tutorial" }).click();

    const stats = page.getByRole("dialog").filter({ hasText: "Sua caminhada de hoje" });
    await expect(stats).toBeVisible();
    await stats.getByRole("button", { name: "Próximo" }).click();

    const group = page.getByRole("dialog").filter({ hasText: "Seu grupo de fé" });
    await expect(group).toBeVisible();
    await group.getByRole("button", { name: "Voltar" }).click();

    await expect(stats).toBeVisible();
  });

  test("pular por agora fecha o tutorial na sessão", async ({ page }) => {
    await page.goto("/home?tour=replay");

    const welcome = page.getByRole("dialog").filter({ hasText: "Bem-vindo ao PrayRats" });
    await expect(welcome).toBeVisible({ timeout: 15_000 });
    await welcome.getByRole("button", { name: "Agora não" }).click();

    const skipDialog = page.getByRole("alertdialog");
    await expect(skipDialog).toBeVisible();
    await skipDialog.getByRole("button", { name: "Pular por agora" }).click();

    await expect(welcome).not.toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("dialog").filter({ hasText: "Bem-vindo ao PrayRats" }),
    ).not.toBeVisible({ timeout: 5_000 });
  });

  test("layout mobile não gera overflow horizontal", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/home?tour=replay");

    await expect(
      page.getByRole("dialog").filter({ hasText: "Bem-vindo ao PrayRats" }),
    ).toBeVisible({ timeout: 15_000 });

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });

  test("target ausente não quebra a aplicação", async ({ page }) => {
    await page.goto("/home?tour=replay");

    const welcome = page.getByRole("dialog").filter({ hasText: "Bem-vindo ao PrayRats" });
    await expect(welcome).toBeVisible({ timeout: 15_000 });
    await welcome.getByRole("button", { name: "Começar tutorial" }).click();

    await page.evaluate(() => {
      document.querySelectorAll("[data-tour-id='home-stats']").forEach((el) => el.remove());
    });

    const stats = page.getByRole("dialog").filter({ hasText: "Sua caminhada de hoje" });
    await expect(stats).toBeVisible();
    await stats.getByRole("button", { name: "Próximo" }).click();

    await expect(page.getByRole("dialog").filter({ hasText: "Seu grupo de fé" })).toBeVisible();
  });
});
