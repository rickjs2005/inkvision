import { test, expect } from "@playwright/test";

// [seed] usa a conta de cliente criada por `pnpm seed:demo`.
const CLIENT_EMAIL = "cliente@inkvision.app";
const PASSWORD = "inkvision123";

test.describe("Autenticação", () => {
  test("login válido leva ao /painel", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();

    // Labels reais do formulário: "E-mail" e "Senha".
    await page.getByLabel("E-mail").fill(CLIENT_EMAIL);
    await page.getByLabel("Senha").fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/painel/);
    await expect(page.getByRole("heading", { name: "Seu painel" })).toBeVisible();
  });

  test("credencial inválida mostra erro e permanece no login", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").fill(CLIENT_EMAIL);
    await page.getByLabel("Senha").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    // Mensagem de erro renderizada com a classe de destaque destrutivo.
    await expect(page.locator("p.text-destructive")).toBeVisible();
    // Não deve navegar para o painel.
    await expect(page).not.toHaveURL(/\/painel/);
  });
});
