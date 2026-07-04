import { logger } from "@/lib/logger";

/**
 * Executado pelo Next.js no boot do servidor (edge e node).
 * Só rodamos DB/Sentry no runtime nodejs para não quebrar o edge runtime.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (process.env.SENTRY_DSN) {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
    logger.info("Sentry inicializado");
  }

  const { assertAppRoleSafe } = await import("@inkvision/db");
  try {
    await assertAppRoleSafe();
  } catch (err) {
    logger.error({ err }, "assertAppRoleSafe falhou no boot");
    // Em produção queremos que o boot falhe se o guard de RLS lançar.
    if (process.env.NODE_ENV === "production") throw err;
  }
}
