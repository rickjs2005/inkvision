import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("carrega o hero com heading e campo de busca", async ({ page }) => {
    await page.goto("/");

    // Heading do hero (h1). Usa um trecho estável do texto.
    await expect(
      page.getByRole("heading", { level: 1, name: /Veja a arte/i }),
    ).toBeVisible();

    // Campo de busca (input tem aria-label="Buscar").
    await expect(page.getByRole("textbox", { name: "Buscar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Buscar" })).toBeVisible();
  });

  test("buscar 'Blackwork' navega para /tatuadores com o query", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("textbox", { name: "Buscar" }).fill("Blackwork");
    await page.getByRole("button", { name: "Buscar" }).click();

    await expect(page).toHaveURL(/\/tatuadores\?q=Blackwork/);
    await expect(page.getByRole("heading", { level: 1, name: "Tatuadores" })).toBeVisible();
  });
});
