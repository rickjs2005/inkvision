import { test, expect } from "@playwright/test";

// [seed] depende do estúdio/tatuadores criados por `pnpm seed:demo`.
test.describe("Descoberta de tatuadores", () => {
  test("/tatuadores lista ao menos um tatuador", async ({ page }) => {
    await page.goto("/tatuadores");

    await expect(page.getByRole("heading", { level: 1, name: "Tatuadores" })).toBeVisible();

    // Cada card de artista é um link para /t/<id>. Garante ao menos um visível.
    const artistLinks = page.locator('a[href^="/t/"]');
    await expect(artistLinks.first()).toBeVisible();
    expect(await artistLinks.count()).toBeGreaterThan(0);
  });

  test("clicar num tatuador leva ao perfil público /t/...", async ({ page }) => {
    await page.goto("/tatuadores");

    const firstArtist = page.locator('a[href^="/t/"]').first();
    await expect(firstArtist).toBeVisible();
    await firstArtist.click();

    await expect(page).toHaveURL(/\/t\/.+/);
    // A página do artista tem o nome como h1.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
