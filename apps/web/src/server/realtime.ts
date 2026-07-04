import "server-only";
import { SignJWT } from "jose";
import { conversationRoom } from "@inkvision/shared";

const SECRET = new TextEncoder().encode(process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me");
const EMIT_URL = process.env.REALTIME_EMIT_URL ?? "http://localhost:4000";
const EMIT_SECRET = process.env.REALTIME_EMIT_SECRET ?? "dev-emit-secret";

/**
 * Emite um token de sala assinado. Só é gerado após o web autorizar o acesso à
 * conversa, então o realtime confia nas claims sem consultar o banco.
 */
export async function signRoomToken(userId: string, conversationId: string): Promise<string> {
  return new SignJWT({ conv: conversationId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(SECRET);
}

/**
 * Publica um evento no serviço de realtime (server-to-server). Falha em silêncio
 * — se o realtime estiver fora do ar no dev, a mensagem já está persistida e
 * aparece no próximo carregamento.
 */
export async function emitToConversation(
  conversationId: string,
  event: string,
  payload: unknown,
): Promise<void> {
  try {
    await fetch(`${EMIT_URL}/emit`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-emit-secret": EMIT_SECRET },
      body: JSON.stringify({ room: conversationRoom(conversationId), event, payload }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // realtime indisponível — ignora no dev.
  }
}
