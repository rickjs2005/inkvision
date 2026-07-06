import { test, expect } from "@playwright/test";

// [seed] usa a conta de cliente criada por `pnpm seed:demo`.
const CLIENT_EMAIL = "cliente@inkvision.app";
const PASSWORD = "inkvision123";

test.describe("Autenticação", () => {
  test("login válido leva ao /painel", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();

    // Labels reais do formulário: "E-mail" e "Senha".
    await page.getByLabel("E-mail").fill(CLIENT_EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL(/\/painel/);
    // Painel do cliente: h1 "Bem-vindo de volta" + atalho "Meus pedidos".
    await expect(page.getByRole("heading", { name: "Bem-vindo de volta" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Meus pedidos" })).toBeVisible();
  });

  test("credencial inválida mostra erro e permanece no login", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("E-mail").fill(CLIENT_EMAIL);
    await page.getByLabel("Senha", { exact: true }).fill("senha-errada");
    await page.getByRole("button", { name: "Entrar" }).click();

    // Mensagem de erro renderizada com a classe de destaque destrutivo.
    await expect(page.locator("p.text-destructive")).toBeVisible();
    // Não deve navegar para o painel.
    await expect(page).not.toHaveURL(/\/painel/);
  });
});
