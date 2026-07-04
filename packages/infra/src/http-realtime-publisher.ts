import { userRoom } from "@inkvision/shared";
import type { RealtimePublisher } from "@inkvision/core";

/**
 * Lê um segredo obrigatório do ambiente. Em produção, falha duro se ausente
 * (/emit ficaria spoofável). Fora de produção, cai num default de dev com aviso.
 */
function requireSecret(name: string): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} é obrigatório em produção`);
  }
  const devDefaults: Record<string, string> = {
    BETTER_AUTH_SECRET: "dev-secret-change-me",
    REALTIME_EMIT_SECRET: "dev-emit-secret",
  };
  const fallback = devDefaults[name] ?? "dev-secret-change-me";
  console.warn(`⚠️  ${name} ausente — usando default de dev. NÃO use em produção.`);
  return fallback;
}

/**
 * Publica eventos no serviço de realtime via POST /emit (server-to-server).
 * Falha em silêncio — a persistência não depende do realtime estar no ar.
 */
export class HttpRealtimePublisher implements RealtimePublisher {
  constructor(
    private readonly emitUrl = process.env.REALTIME_EMIT_URL ?? "http://localhost:4000",
    private readonly emitSecret = requireSecret("REALTIME_EMIT_SECRET"),
  ) {}

  async toUser(userId: string, event: string, payload: unknown): Promise<void> {
    try {
      await fetch(`${this.emitUrl}/emit`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-emit-secret": this.emitSecret },
        body: JSON.stringify({ room: userRoom(userId), event, payload }),
        signal: AbortSignal.timeout(2000),
      });
    } catch {
      // realtime indisponível — ignora.
    }
  }
}
