import { NextResponse } from "next/server";
import { falImageToImage } from "@inkvision/ai";
import { clientIp, rateLimit } from "@/server/rate-limit";

/**
 * Simulação por IA do /simular público (sem login). O cliente compõe a prévia
 * (pele + arte posicionada) e manda a imagem composta; a Fal refina para uma
 * tatuagem realista via img2img. O prompt é FIXO no servidor — o cliente só
 * controla a imagem — e a rota é rate-limitada por IP (endpoint pago).
 */

/** Prompt fixo: transformar a arte sobreposta em tatuagem crível. */
const PROMPT =
  "The image shows a tattoo design overlaid flat on skin. Repaint it as a real healed tattoo: " +
  "keep the exact same design, position, size and rotation, but make the ink follow the body's " +
  "curvature and perspective, sit under the skin, and match the lighting, shadows, tone and pores. " +
  "Do not add, remove or move anything else in the image.";

/** 0..1 — baixo o suficiente para preservar a composição, alto p/ realismo. */
const STRENGTH = 0.5;

/** ~4 MB de data URI (a prévia sai do canvas com ~900px, bem abaixo disso). */
const MAX_IMAGE_CHARS = 4_000_000;

/** 5 gerações a cada 10 min por IP. */
const RL_LIMIT = 5;
const RL_WINDOW_MS = 10 * 60_000;

const err = (message: string, status: number, headers?: HeadersInit) =>
  NextResponse.json({ error: message }, { status, headers });

export async function POST(req: Request) {
  if (!process.env.FAL_API_KEY) {
    return err("A simulação por IA não está disponível no momento.", 503);
  }

  const body = (await req.json().catch(() => null)) as
    | { image?: unknown; usesRealPhoto?: unknown; consent?: unknown }
    | null;
  const image = body?.image;
  if (
    typeof image !== "string" ||
    !/^data:image\/(png|jpeg);base64,/.test(image) ||
    image.length > MAX_IMAGE_CHARS
  ) {
    return err("Imagem inválida.", 400);
  }

  // O servidor não pode distinguir uma foto real de uma pele sintética a
  // partir só dos pixels — por isso o cliente PRECISA declarar explicitamente
  // `usesRealPhoto`. Se declarar que é uma foto real, `consent` precisa vir
  // `true`: sem isso, não processamos (a foto vai para um provedor de IA de
  // terceiro — não fazemos isso sem consentimento explícito na própria
  // requisição, já que o fluxo é anônimo e não há conta para vincular aceite).
  if (body?.usesRealPhoto === true && body?.consent !== true) {
    return err("É necessário consentir com o processamento da foto por IA antes de continuar.", 400);
  }

  const rl = await rateLimit(`public-simulate:${clientIp(req)}`, RL_LIMIT, RL_WINDOW_MS);
  if (!rl.ok) {
    return err("Você usou suas gerações por agora. Tente novamente em alguns minutos.", 429, {
      "Retry-After": String(Math.max(1, Math.ceil(rl.retryAfterMs / 1000))),
    });
  }

  try {
    const resultUrl = await falImageToImage({ imageUrl: image, prompt: PROMPT, strength: STRENGTH });

    // Devolve a imagem inline (data URI): o cliente exibe e baixa sem CORS e
    // sem depender do tempo de vida da URL da Fal.
    const res = await fetch(resultUrl, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`download da imagem gerada falhou (${res.status})`);
    const mime = res.headers.get("content-type") ?? "image/jpeg";
    const b64 = Buffer.from(await res.arrayBuffer()).toString("base64");
    return NextResponse.json({ image: `data:${mime};base64,${b64}` });
  } catch (e) {
    console.error("[/api/simular]", e);
    return err("A IA não conseguiu gerar agora. Tente de novo em instantes.", 502);
  }
}
