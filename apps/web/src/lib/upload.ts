import type { UploadPurpose } from "@inkvision/core";

export interface UploadResult {
  publicUrl: string;
  key: string;
}

/**
 * Fluxo de upload no cliente: pede um ticket presigned, envia o arquivo (PUT)
 * e devolve a URL pública. No dev o PUT cai numa rota-sink (mock).
 */
export async function uploadFile(
  file: File,
  purpose: UploadPurpose,
  studioId?: string,
): Promise<UploadResult> {
  const ticketRes = await fetch("/api/uploads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      purpose,
      studioId,
      filename: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }),
  });
  if (!ticketRes.ok) {
    const { error } = await ticketRes.json().catch(() => ({ error: "Falha no upload" }));
    throw new Error(error ?? "Falha no upload");
  }
  const ticket = (await ticketRes.json()) as { uploadUrl: string; publicUrl: string; key: string };

  const put = await fetch(ticket.uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!put.ok) {
    const { error } = await put.json().catch(() => ({ error: null }));
    throw new Error(error ?? "Falha ao enviar o arquivo");
  }

  // Verificação de magic bytes pós-upload (com R2, o servidor lê o começo do
  // objeto; conteúdo disfarçado é apagado do bucket e o upload falha aqui).
  const verify = await fetch("/api/uploads/verify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: ticket.key }),
  });
  if (!verify.ok) {
    const { error } = await verify.json().catch(() => ({ error: null }));
    throw new Error(error ?? "Arquivo rejeitado na verificação");
  }

  return { publicUrl: ticket.publicUrl, key: ticket.key };
}
