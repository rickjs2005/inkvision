export type UploadPurpose =
  | "portfolio"
  | "avatar"
  | "reference"
  | "design"
  | "body-photo"
  | "chat";

export interface CreateUploadUrlInput {
  studioId?: string;
  purpose: UploadPurpose;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface UploadTicket {
  /** URL para o cliente enviar o arquivo (PUT). */
  uploadUrl: string;
  /** URL pública final do arquivo após o upload. */
  publicUrl: string;
  /** Chave do objeto no bucket. */
  key: string;
}

/**
 * Abstração de armazenamento de mídia. O provider concreto (Cloudflare R2 no
 * futuro, mock no dev) é injetado — trocar não afeta os casos de uso.
 */
export interface StorageService {
  createUploadUrl(input: CreateUploadUrlInput): Promise<UploadTicket>;
  delete(key: string): Promise<void>;
  /**
   * Apaga o objeto a partir da SUA PRÓPRIA URL pública (não da key) — usado
   * pela eliminação LGPD, que só tem acesso às URLs gravadas no banco
   * (fileUrl/bodyPhotoUrl/attachmentUrl/image), nunca à key bruta. Cada
   * provider sabe extrair a key do formato da própria URL pública; uma URL
   * que não pertence a este provider (ex.: imagem de demo externa) é
   * ignorada com segurança — não é um objeto deste bucket para apagar.
   */
  deleteByPublicUrl(publicUrl: string): Promise<void>;
  /**
   * Primeiros bytes do objeto (verificação de magic bytes pós-upload).
   * `null` quando o provider não persiste bytes (mock) — nesse caso a
   * validação acontece no sink de upload do dev.
   */
  readHead(key: string, maxBytes: number): Promise<Uint8Array | null>;
}

/** Restrições de upload aplicadas na borda antes de gerar o ticket. */
export const UPLOAD_LIMITS: Record<UploadPurpose, { maxBytes: number; mime: RegExp }> = {
  portfolio: { maxBytes: 25 * 1024 * 1024, mime: /^(image\/(jpeg|png|webp|avif)|video\/mp4)$/ },
  avatar: { maxBytes: 5 * 1024 * 1024, mime: /^image\/(jpeg|png|webp|avif)$/ },
  reference: { maxBytes: 15 * 1024 * 1024, mime: /^(image\/\w+|application\/pdf)$/ },
  design: { maxBytes: 25 * 1024 * 1024, mime: /^image\/(png|jpeg|webp)$/ },
  "body-photo": { maxBytes: 15 * 1024 * 1024, mime: /^image\/(jpeg|png|webp)$/ },
  chat: {
    maxBytes: 25 * 1024 * 1024,
    mime: /^(image\/\w+|audio\/(mpeg|mp4|webm|ogg|wav)|video\/(mp4|webm)|application\/pdf)$/,
  },
};
