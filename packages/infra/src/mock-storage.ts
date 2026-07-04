import { createHash } from "node:crypto";
import type {
  CreateUploadUrlInput,
  StorageService,
  UploadTicket,
} from "@inkvision/core";

/** Fotos reais de tatuagem (Unsplash) para o portfólio parecer real no demo. */
const DEMO_IMAGES = [
  "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a",
  "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d",
  "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28",
  "https://images.unsplash.com/photo-1590246814883-57c511e76523",
  "https://images.unsplash.com/photo-1543059080-f9b1272213d5",
  "https://images.unsplash.com/photo-1562962230-16e4623d36e6",
];

function slugifyFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(0, 60);
}

/**
 * Adapter de storage para desenvolvimento. NÃO persiste bytes: o upload (PUT)
 * cai numa rota-sink que descarta o arquivo, e `publicUrl` resolve para uma
 * imagem de demonstração determinística. Troque por R2StorageService em prod
 * sem tocar nos casos de uso.
 */
export class MockStorageService implements StorageService {
  constructor(private readonly baseUrl = "") {}

  async createUploadUrl(input: CreateUploadUrlInput): Promise<UploadTicket> {
    const scope = input.studioId ?? "platform";
    const key = `${input.purpose}/${scope}/${Date.now()}-${slugifyFilename(input.filename)}`;

    const isImage = input.contentType.startsWith("image/");
    const hash = createHash("sha1").update(key).digest("hex");
    const idx = parseInt(hash.slice(0, 8), 16) % DEMO_IMAGES.length;
    const publicUrl = isImage
      ? `${DEMO_IMAGES[idx]}?w=1200&q=80&auto=format&fit=crop&ixid=${hash.slice(0, 8)}`
      : `${this.baseUrl}/api/uploads/mock/${key}`;

    return {
      key,
      publicUrl,
      uploadUrl: `${this.baseUrl}/api/uploads/mock/${key}`,
    };
  }

  async delete(): Promise<void> {
    // no-op no mock
  }
}
