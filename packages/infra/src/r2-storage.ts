import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { CreateUploadUrlInput, StorageService, UploadTicket } from "@inkvision/core";

function slugifyFilename(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(0, 60);
}

/** Validade do presigned PUT — curta de propósito (o cliente usa na hora). */
const UPLOAD_URL_TTL_SECONDS = 10 * 60;

/**
 * Storage real no Cloudflare R2 (API S3). O cliente envia direto pro bucket
 * via presigned PUT — o Content-Type e o tamanho entram na assinatura, então
 * não dá para trocá-los depois do presign. A verificação de magic bytes
 * pós-upload usa readHead (GET com Range) via /api/uploads/verify.
 *
 * Env: R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY · R2_BUCKET ·
 * R2_PUBLIC_URL (domínio público do bucket, ex. https://media.seudominio.com).
 */
export class R2StorageService implements StorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const accountId = env.R2_ACCOUNT_ID;
    const accessKeyId = env.R2_ACCESS_KEY_ID;
    const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
    const bucket = env.R2_BUCKET;
    const publicUrl = env.R2_PUBLIC_URL;
    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
      throw new Error(
        "R2 não configurado — defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET e R2_PUBLIC_URL.",
      );
    }
    this.bucket = bucket;
    this.publicBaseUrl = publicUrl.replace(/\/$/, "");
    this.s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  async createUploadUrl(input: CreateUploadUrlInput): Promise<UploadTicket> {
    const scope = input.studioId ?? "platform";
    const key = `${input.purpose}/${scope}/${Date.now()}-${slugifyFilename(input.filename)}`;

    const uploadUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: input.contentType,
        ContentLength: input.sizeBytes,
      }),
      { expiresIn: UPLOAD_URL_TTL_SECONDS },
    );

    return { key, uploadUrl, publicUrl: `${this.publicBaseUrl}/${key}` };
  }

  async delete(key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async deleteByPublicUrl(publicUrl: string): Promise<void> {
    const prefix = `${this.publicBaseUrl}/`;
    if (!publicUrl.startsWith(prefix)) return; // não é um objeto deste bucket
    const key = publicUrl.slice(prefix.length);
    await this.delete(key);
  }

  async readHead(key: string, maxBytes: number): Promise<Uint8Array | null> {
    try {
      const res = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Range: `bytes=0-${Math.max(0, maxBytes - 1)}`,
        }),
      );
      const body = await res.Body?.transformToByteArray();
      return body ?? null;
    } catch (e) {
      // Objeto inexistente → null (o verify trata como inválido).
      if ((e as { name?: string }).name === "NoSuchKey") return null;
      throw e;
    }
  }
}
