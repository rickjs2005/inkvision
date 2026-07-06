import { test, expect } from "@playwright/test";

// [seed] depende do cliente + pedido de exemplo (cliente → Rafa Costa,
// "Antebraço direito") criados por `pnpm seed:demo`.
const CLIENT_EMAIL = "cliente@inkvision.app";
const PASSWORD = "inkvision123";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail").fill(CLIENT_EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/painel/);
}

test.describe("Pedidos do cliente", () => {
  test("lista os pedidos e navega até o detalhe", async ({ page }) => {
    await login(page);

    await page.goto("/pedidos");
    await expect(page.getByRole("heading", { name: "Meus pedidos" })).toBeVisible();

    // Ao menos um card de pedido — cada um é um link para /pedidos/<id>.
    const orderLinks = page.locator('a[href^="/pedidos/"]');
    await expect(orderLinks.first()).toBeVisible();

    await orderLinks.first().click();
    await expect(page).toHaveURL(/\/pedidos\/.+/);

    // Detalhe do pedido: h1 com o nome do artista e o bloco de conversa.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Conversa com/i)).toBeVisible();
  });
});
