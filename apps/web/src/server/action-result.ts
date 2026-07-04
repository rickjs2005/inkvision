import { DomainError } from "@inkvision/core";
import { logError } from "@/lib/logger";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/** Executa um caso de uso e converte erros de domínio em resultado tratável na UI. */
export async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof DomainError) {
      return { ok: false, error: e.message, code: e.code };
    }
    if (process.env.SENTRY_DSN) {
      const Sentry = await import("@sentry/nextjs");
      Sentry.captureException(e);
    }
    logError(e, { scope: "action" });
    return { ok: false, error: "Algo deu errado. Tente novamente." };
  }
}
