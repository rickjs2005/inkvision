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
// Com E2E_BASE_URL definido, testa um ambiente já no ar (ex.: o deploy de
// teste da Vercel) em vez de subir servidor local.
const externalBaseUrl = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: externalBaseUrl ?? "http://localhost:3000",
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

  // Local: reutiliza um `pnpm dev` já rodando (ou sobe a partir da raiz — isto
  // não semeia o banco; rode `pnpm setup:local` antes). CI: serve o build de
  // produção (`next start`), feito num passo anterior do workflow — mais perto
  // do deploy real e sem depender do turbo subir realtime/worker.
  webServer: externalBaseUrl
    ? undefined
    : {
        command: process.env.CI ? "pnpm start" : "pnpm --dir .. dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
