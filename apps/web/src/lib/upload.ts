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
  if (!put.ok) throw new Error("Falha ao enviar o arquivo");

  return { publicUrl: ticket.publicUrl, key: ticket.key };
}
