import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração E2E do InkVision (app web).
 *
 * PRÉ-REQUISITOS (o E2E depende do banco de demo semeado):
 *   1. `pnpm setup:local`  — sobe o banco (prisma dev), aplica migrations e semeia o demo.
 *   2. `pnpm seed:demo`    — (re)cria o estúdio/tatuadores/pedido de exemplo, caso precise.
 *   3. `pnpm dev` (na raiz) — sobe web (:3000) + realtime + worker.
 *
 * Contas do seed (senha `inkvision123` para todas):
 *   cliente@inkvision.app · alma@inkvision.app · rafa@inkvision.app · admin@inkvision.app
 *
 * Vários specs assumem esse estado semeado (marcados com comentário "[seed]").
 *
 * O `webServer` abaixo REUTILIZA um servidor já rodando (reuseExistingServer).
 * Se nenhum estiver de pé, ele tenta subir `pnpm dev` a partir da raiz do monorepo
 * — mas isso NÃO semeia o banco, então rode `pnpm setup:local` antes de qualquer forma.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  // Reutiliza um `pnpm dev` já rodando. Se não houver, sobe a partir da raiz do
  // monorepo (`--dir ..`). Lembre-se: isto não semeia o banco — rode
  // `pnpm setup:local` antes. Timeout generoso porque o turbo sobe vários apps.
  webServer: {
    command: "pnpm --dir .. dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
