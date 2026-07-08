import { NextResponse } from "next/server";
import { UPLOAD_LIMITS, isPlatformAdmin, membershipIn, type Actor, type UploadPurpose } from "@inkvision/core";
import { withUser } from "@inkvision/db";
import { getActor } from "@/server/auth-context";
import { storage } from "@/server/container";
import { rateLimit, sameOrigin } from "@/server/rate-limit";

/**
 * O actor tem uma relação legítima com este estúdio — como membro da equipe
 * OU como cliente com pelo menos um pedido lá. Sem o segundo caso, um cliente
 * comum (nunca é "membro" de estúdio) não conseguiria subir foto do corpo,
 * referência ou anexo de chat para o próprio pedido — regressão real pega no
 * teste manual do fluxo completo após o fix de IDOR desta rota.
 */
async function hasAccessToStudio(actor: Actor, studioId: string): Promise<boolean> {
  if (isPlatformAdmin(actor) || membershipIn(actor, studioId)) return true;
  const order = await withUser(actor.userId, (tx) =>
    tx.order.findFirst({ where: { studioId, clientId: actor.userId }, select: { id: true } }),
  );
  return order !== null;
}

const PURPOSES = Object.keys(UPLOAD_LIMITS) as UploadPurpose[];

/** Gera um ticket de upload (presigned). Valida auth, origem, tipo e tamanho na borda. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Origem inválida" }, { status: 403 });

  const actor = await getActor();
  if (!actor) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Máx. 30 uploads/min por usuário.
  const rl = await rateLimit(`upload:${actor.userId}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let payload: {
    purpose?: string;
    filename?: string;
    contentType?: string;
    sizeBytes?: number;
    studioId?: string;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { purpose, filename, contentType, sizeBytes, studioId } = payload;
  if (!purpose || !PURPOSES.includes(purpose as UploadPurpose)) {
    return NextResponse.json({ error: "Propósito inválido" }, { status: 400 });
  }
  if (!filename || !contentType || typeof sizeBytes !== "number") {
    return NextResponse.json({ error: "Parâmetros ausentes" }, { status: 400 });
  }
  // O studioId vira parte da key no bucket (`${purpose}/${studioId}/...`) —
  // sem essa checagem, qualquer usuário autenticado conseguia um ticket de
  // upload sob o namespace de storage de OUTRO estúdio (achado de pentest).
  if (studioId && !(await hasAccessToStudio(actor, studioId))) {
    return NextResponse.json({ error: "Sem acesso a este estúdio" }, { status: 403 });
  }

  const limit = UPLOAD_LIMITS[purpose as UploadPurpose];
  if (!limit.mime.test(contentType)) {
    return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 415 });
  }
  if (sizeBytes <= 0 || sizeBytes > limit.maxBytes) {
    return NextResponse.json({ error: "Arquivo excede o tamanho máximo" }, { status: 413 });
  }

  const ticket = await storage.createUploadUrl({
    purpose: purpose as UploadPurpose,
    filename,
    contentType,
    sizeBytes,
    studioId,
  });
  return NextResponse.json(ticket);
}
