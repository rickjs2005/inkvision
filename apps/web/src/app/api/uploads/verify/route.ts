import { NextResponse } from "next/server";
import { MAGIC_HEAD_BYTES, UPLOAD_LIMITS, sniffedMimeAllowed, type UploadPurpose } from "@inkvision/core";
import { getActor } from "@/server/auth-context";
import { storage } from "@/server/container";
import { rateLimit } from "@/server/rate-limit";

/**
 * Verificação de magic bytes PÓS-upload. Com storage real (R2), o cliente
 * envia direto pro bucket via presigned URL — o servidor nunca vê os bytes;
 * aqui lemos o começo do objeto (Range) e conferimos se o conteúdo real
 * satisfaz a política do propósito. Conteúdo disfarçado é APAGADO do bucket.
 * No mock (readHead → null) a validação já aconteceu no sink do PUT.
 */
export async function POST(req: Request) {
  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rl = await rateLimit(`upload-verify:${actor.userId}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const { key } = (await req.json().catch(() => ({}))) as { key?: string };
  if (!key || typeof key !== "string" || key.includes("..")) {
    return NextResponse.json({ error: "Key inválida" }, { status: 400 });
  }
  const purpose = key.split("/")[0] as UploadPurpose;
  const limit = UPLOAD_LIMITS[purpose];
  if (!limit) return NextResponse.json({ error: "Propósito inválido" }, { status: 400 });

  const head = await storage.readHead(key, MAGIC_HEAD_BYTES);
  if (head === null) {
    // Provider sem bytes persistidos (mock) — o sink do PUT já validou.
    return NextResponse.json({ ok: true, verified: false });
  }

  if (!sniffedMimeAllowed(head, limit.mime)) {
    // Conteúdo disfarçado: remove do bucket antes que alguém aponte pra ele.
    await storage.delete(key).catch(() => {});
    return NextResponse.json(
      { error: "O conteúdo do arquivo não corresponde a um tipo permitido" },
      { status: 415 },
    );
  }
  return NextResponse.json({ ok: true, verified: true });
}
