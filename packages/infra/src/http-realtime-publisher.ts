import { userRoom } from "@inkvision/shared";
import type { RealtimePublisher } from "@inkvision/core";

/**
 * Publica eventos no serviço de realtime via POST /emit (server-to-server).
 * Falha em silêncio — a persistência não depende do realtime estar no ar.
 */
export class HttpRealtimePublisher implements RealtimePublisher {
  constructor(
    private readonly emitUrl = process.env.REALTIME_EMIT_URL ?? "http://localhost:4000",
    private readonly emitSecret = process.env.REALTIME_EMIT_SECRET ?? "dev-emit-secret",
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
