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

  // Sem REDIS_URL em produção, três coisas degradam ao mesmo tempo e em
  // silêncio: rate limit vira por-instância (várias réplicas = limite N vezes
  // mais permissivo que o configurado), a fila de simulação de IA roda inline
  // na própria request (bloqueia a function pelo tempo da chamada à IA, até
  // 60s), e o realtime não propaga eventos entre instâncias. Não falhamos o
  // boot (o deploy de teste na Vercel roda assim hoje, de propósito), mas isso
  // não pode passar batido — loga alto para aparecer em qualquer sistema de
  // observabilidade que colete logs de erro.
  if (process.env.NODE_ENV === "production" && !process.env.REDIS_URL) {
    logger.error(
      "REDIS_URL ausente em produção — rate limit, fila de simulação de IA e realtime " +
        "degradam para modo single-instance (em memória/inline), silenciosamente. " +
        "Configure REDIS_URL se rodar mais de uma réplica de apps/web ou apps/realtime.",
    );
  }
}
