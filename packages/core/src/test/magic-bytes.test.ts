import { describe, expect, it } from "vitest";
import { sniffMime, sniffedMimeAllowed } from "../domain/magic-bytes";
import { UPLOAD_LIMITS } from "../application/ports/storage";

function bytes(...parts: (number[] | string)[]): Uint8Array {
  const out: number[] = [];
  for (const p of parts) {
    if (typeof p === "string") for (const c of p) out.push(c.charCodeAt(0));
    else out.push(...p);
  }
  return new Uint8Array(out);
}

const JPEG = bytes([0xff, 0xd8, 0xff, 0xe0], "JFIF");
const PNG = bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = bytes("RIFF", [0x24, 0x00, 0x00, 0x00], "WEBPVP8 ");
const AVIF = bytes([0x00, 0x00, 0x00, 0x1c], "ftypavif");
const GIF = bytes("GIF89a");
const PDF = bytes("%PDF-1.7");
const MP4 = bytes([0x00, 0x00, 0x00, 0x18], "ftypisom");
const WEBM = bytes([0x1a, 0x45, 0xdf, 0xa3]);
const OGG = bytes("OggS");
const WAV = bytes("RIFF", [0x24, 0x00, 0x00, 0x00], "WAVEfmt ");
const MP3_ID3 = bytes("ID3", [0x04, 0x00]);
const HTML = bytes("<!DOCTYPE html><script>");
const SVG = bytes('<svg xmlns="http://www.w3.org/2000/svg">');

describe("magic bytes — sniffMime", () => {
  it.each([
    ["jpeg", JPEG, "image/jpeg"],
    ["png", PNG, "image/png"],
    ["webp", WEBP, "image/webp"],
    ["avif", AVIF, "image/avif"],
    ["gif", GIF, "image/gif"],
    ["pdf", PDF, "application/pdf"],
    ["mp4", MP4, "video/mp4"],
    ["webm", WEBM, "video/webm"],
    ["ogg", OGG, "audio/ogg"],
    ["wav", WAV, "audio/wav"],
    ["mp3 (ID3)", MP3_ID3, "audio/mpeg"],
  ] as const)("detecta %s", (_label, head, expected) => {
    expect(sniffMime(head)).toBe(expected);
  });

  it("desconhecido/vazio → null (deve ser rejeitado)", () => {
    expect(sniffMime(HTML)).toBeNull();
    expect(sniffMime(SVG)).toBeNull();
    expect(sniffMime(new Uint8Array(0))).toBeNull();
    expect(sniffMime(bytes([0x00, 0x01, 0x02]))).toBeNull();
  });
});

describe("magic bytes — política por propósito", () => {
  it("HTML disfarçado de PNG é rejeitado no avatar", () => {
    expect(sniffedMimeAllowed(HTML, UPLOAD_LIMITS.avatar.mime)).toBe(false);
  });

  it("SVG (vetor executável) é rejeitado mesmo onde image/* é amplo", () => {
    expect(sniffedMimeAllowed(SVG, UPLOAD_LIMITS.reference.mime)).toBe(false);
  });

  it("PDF passa em reference mas não em portfolio", () => {
    expect(sniffedMimeAllowed(PDF, UPLOAD_LIMITS.reference.mime)).toBe(true);
    expect(sniffedMimeAllowed(PDF, UPLOAD_LIMITS.portfolio.mime)).toBe(false);
  });

  it("mp4 passa em portfolio; webm de áudio/vídeo passa no chat", () => {
    expect(sniffedMimeAllowed(MP4, UPLOAD_LIMITS.portfolio.mime)).toBe(true);
    expect(sniffedMimeAllowed(WEBM, UPLOAD_LIMITS.chat.mime)).toBe(true);
  });

  it("imagens comuns passam nos propósitos de imagem", () => {
    for (const img of [JPEG, PNG, WEBP, AVIF]) {
      expect(sniffedMimeAllowed(img, UPLOAD_LIMITS.avatar.mime)).toBe(true);
    }
    // body-photo é mais restrito (sem avif).
    expect(sniffedMimeAllowed(JPEG, UPLOAD_LIMITS["body-photo"].mime)).toBe(true);
    expect(sniffedMimeAllowed(AVIF, UPLOAD_LIMITS["body-photo"].mime)).toBe(false);
  });
});
