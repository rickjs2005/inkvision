import { test, expect } from "@playwright/test";

// Checagens leves de acessibilidade (sem axe/deps novas) — só roles e nomes.
test.describe("A11y smoke — home", () => {
  test("tem landmarks e controles com nome acessível", async ({ page }) => {
    await page.goto("/");

    // Landmark <main> presente (do MarketingLayout).
    await expect(page.getByRole("main")).toBeVisible();

    // Landmarks de navegação e rodapé.
    await expect(page.getByRole("banner")).toBeVisible(); // <header>
    await expect(page.getByRole("contentinfo")).toBeVisible(); // <footer>

    // Exatamente um h1 (o hero).
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    // Botão de tema tem nome acessível ("Alternar tema").
    await expect(page.getByRole("button", { name: "Alternar tema" })).toBeVisible();

    // O campo de busca é rotulado.
    await expect(page.getByRole("textbox", { name: "Buscar" })).toBeVisible();
  });
});
