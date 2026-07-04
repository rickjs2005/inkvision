import "server-only";
import { SignJWT } from "jose";
import { conversationRoom } from "@inkvision/shared";

/**
 * Lê um segredo obrigatório do ambiente. Em produção, falha duro se ausente
 * (tokens de sala forjáveis / /emit spoofável). Fora de produção, cai num
 * default de dev com um aviso.
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

const SECRET = new TextEncoder().encode(requireSecret("BETTER_AUTH_SECRET"));
const EMIT_URL = process.env.REALTIME_EMIT_URL ?? "http://localhost:4000";
const EMIT_SECRET = requireSecret("REALTIME_EMIT_SECRET");

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
