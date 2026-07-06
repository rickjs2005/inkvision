import { NextResponse } from "next/server";
import { MAGIC_HEAD_BYTES, UPLOAD_LIMITS, sniffedMimeAllowed, type UploadPurpose } from "@inkvision/core";

/**
 * Sink de upload do MockStorageService: valida os MAGIC BYTES do arquivo
 * contra a política do propósito (primeiro segmento da key) e descarta os
 * bytes. Em produção o cliente envia direto para o R2 via presigned URL e a
 * validação equivalente acontece em /api/uploads/verify.
 */
export async function PUT(req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const { key } = await ctx.params;
  const purpose = key[0] as UploadPurpose | undefined;
  const limit = purpose ? UPLOAD_LIMITS[purpose] : undefined;
  if (!limit) return NextResponse.json({ error: "Propósito inválido" }, { status: 400 });

  const body = await req.arrayBuffer();
  const head = new Uint8Array(body.slice(0, MAGIC_HEAD_BYTES));
  if (!sniffedMimeAllowed(head, limit.mime)) {
    return NextResponse.json(
      { error: "O conteúdo do arquivo não corresponde a um tipo permitido" },
      { status: 415 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
