/**
 * Detecção de tipo real de arquivo pelos magic bytes (assinatura binária).
 * Defesa contra upload de conteúdo disfarçado: o presign valida só o MIME
 * DECLARADO; aqui conferimos o que o arquivo realmente é. Cobre os tipos
 * aceitos em UPLOAD_LIMITS (imagens, vídeo, áudio, PDF).
 */

/** Bytes suficientes para todas as assinaturas suportadas. */
export const MAGIC_HEAD_BYTES = 32;

function ascii(bytes: Uint8Array, start: number, text: string): boolean {
  if (bytes.length < start + text.length) return false;
  for (let i = 0; i < text.length; i++) {
    if (bytes[start + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

function startsWith(bytes: Uint8Array, sig: number[]): boolean {
  if (bytes.length < sig.length) return false;
  return sig.every((b, i) => bytes[i] === b);
}

/**
 * MIME canônico detectado pelos primeiros bytes, ou null se desconhecido.
 * `null` deve ser tratado como REJEIÇÃO pelos chamadores de segurança.
 */
export function sniffMime(head: Uint8Array): string | null {
  // Imagens
  if (startsWith(head, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(head, 0, "GIF87a") || ascii(head, 0, "GIF89a")) return "image/gif";
  if (ascii(head, 0, "RIFF") && ascii(head, 8, "WEBP")) return "image/webp";
  // ISO-BMFF (ftyp em offset 4): avif/heic/mp4 compartilham o container.
  if (ascii(head, 4, "ftyp")) {
    if (ascii(head, 8, "avif") || ascii(head, 8, "avis")) return "image/avif";
    if (ascii(head, 8, "heic") || ascii(head, 8, "heix") || ascii(head, 8, "mif1")) return "image/heic";
    return "video/mp4"; // isom/mp42/M4V/M4A e afins
  }

  // Documento
  if (ascii(head, 0, "%PDF")) return "application/pdf";

  // Vídeo/áudio
  if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm"; // Matroska/WebM
  if (ascii(head, 0, "OggS")) return "audio/ogg";
  if (ascii(head, 0, "RIFF") && ascii(head, 8, "WAVE")) return "audio/wav";
  if (ascii(head, 0, "ID3")) return "audio/mpeg";
  // Frame sync do MP3 sem tag ID3 (FF Ex/FF Fx)
  if (head.length >= 2 && head[0] === 0xff && (head[1]! & 0xe0) === 0xe0) return "audio/mpeg";

  return null;
}

/**
 * O tipo REAL do arquivo satisfaz a política do propósito? Usa a mesma regex
 * de UPLOAD_LIMITS — o que importa é o que o arquivo é, não o que declarou.
 */
export function sniffedMimeAllowed(head: Uint8Array, allowed: RegExp): boolean {
  const mime = sniffMime(head);
  return mime !== null && allowed.test(mime);
}
