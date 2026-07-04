import pino from "pino";

/** Logger estruturado da aplicação. Nível configurável via LOG_LEVEL. */
export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

/** Loga um erro de forma estruturada, anexando contexto opcional. */
export function logError(err: unknown, context?: Record<string, unknown>): void {
  logger.error({ err, ...context });
}
