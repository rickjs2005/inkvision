import type { SimulationRequest, SimulationResult, TattooSimulationProvider } from "../ports";

/**
 * Provider REAL de simulação usando a Stability AI (https://platform.stability.ai).
 *
 * Segundo provider real da plataforma (o primeiro é a Fal, em `fal.ts`) — dá
 * redundância genuína: família de modelo diferente (Stable Diffusion, não
 * Flux), então uma instabilidade/rate limit na Fal não derruba a simulação.
 * Pesquisado em 12/07/2026: o endpoint de inpaint da Stability trabalha com
 * máscara binária de verdade (branco = repinta, preto = preserva — mesma
 * convenção que a Fal já usa aqui), então mantém a MESMA garantia de
 * fidelidade ao desenho que motivou a escolha da Fal originalmente.
 *
 * Diferença de forma em relação à Fal: a Fal devolve a URL de uma imagem já
 * hospedada por ela; a Stability devolve os bytes da imagem (base64) direto
 * na resposta. Por isso este provider retorna um data URI (`data:image/...`)
 * em vez de uma URL de terceiro — funciona no mesmo contrato (`variants` é
 * só `string`), sem precisar hospedar o resultado em storage próprio agora.
 * Se o tamanho do payload virar problema (base64 infla ~33%), trocar para
 * subir os bytes no R2 e devolver a URL pública é a evolução natural — sem
 * mudar a interface `TattooSimulationProvider`.
 */

const BASE_URL = "https://api.stability.ai/v2beta/stable-image";

/** Modelo de inpainting (com máscara) default. Sobrescrito por env STABILITY_INPAINT_ENDPOINT. */
const DEFAULT_INPAINT_PATH = "edit/inpaint";

/** Modelo de image-to-image (sem máscara) default. Sobrescrito por env STABILITY_I2I_ENDPOINT. */
const DEFAULT_I2I_PATH = "generate/ultra";

/** Timeout da chamada ao modelo (imagens costumam levar dezenas de segundos). */
const REQUEST_TIMEOUT_MS = 60_000;

/** Custo estimado por simulação, em centavos (placeholder até termos billing real). */
const ESTIMATED_COST_CENTS = 8;

async function fetchImageBytes(url: string, timeoutMs: number): Promise<Blob> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) {
    throw new Error(`Stability: falha ao baixar imagem de entrada (${url}): ${res.status}`);
  }
  return res.blob();
}

interface StabilityRequestOptions {
  path: string;
  form: FormData;
  timeoutMs: number;
}

/** Resposta em JSON (Accept: application/json) — mais fácil de checar moderação/erro que binário cru. */
interface StabilityResponseBody {
  image?: string; // base64, sem o prefixo data:
  finish_reason?: string; // "SUCCESS" | "CONTENT_FILTERED" | ...
  errors?: string[];
}

/** Chamada bruta a um endpoint v2beta da Stability; extrai a imagem em base64. */
async function callStability({ path, form, timeoutMs }: StabilityRequestOptions): Promise<string> {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error("STABILITY_API_KEY não configurada");
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Falha ao chamar a Stability AI (${path}): ${reason}`);
  }

  if (response.status !== 200) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Stability AI retornou status ${response.status} (${path}): ${detail || response.statusText}`,
    );
  }

  const data = (await response.json()) as StabilityResponseBody;

  // Moderação de conteúdo: a Stability recusa gerar em vez de devolver imagem
  // vazia — falha explícita é melhor que silenciar um resultado ausente.
  if (data.finish_reason && data.finish_reason !== "SUCCESS") {
    throw new Error(`Stability AI recusou a geração (${path}): ${data.finish_reason}`);
  }
  if (!data.image) {
    throw new Error(`Stability AI não retornou imagem (${path}).`);
  }
  return data.image;
}

/** Repintura restrita à máscara — mesma garantia de fidelidade que o inpainting da Fal. */
const INPAINT_PROMPT =
  "Inside the masked area only: turn the tattoo design already composited there into a " +
  "photorealistic, healed tattoo. Keep the design's exact shape unchanged, follow the body's " +
  "curvature and perspective, match the real skin tone, lighting, shadows and pores, and blend " +
  "the ink naturally so it looks like a real tattoo on the skin — not a sticker.";

/** Refino da imagem inteira já composta (sem máscara) — mesmo texto usado pela Fal, mesma restrição. */
const NO_MASK_PROMPT =
  "This photo already shows a tattoo design composited onto the person's skin, in the exact " +
  "position, scale and rotation intended. Refine it into a photorealistic, healed tattoo: " +
  "keep the design's exact shape and position unchanged, follow the body's curvature and " +
  "perspective, match the real skin tone, lighting, shadows and pores, and blend the ink " +
  "naturally so it looks like a real tattoo on the skin — not a sticker. " +
  "Do not add, remove or move anything else in the image.";

/** Força de repintura DENTRO da máscara — fora dela a foto já está 100% preservada pela arquitetura. */
const INPAINT_STRENGTH = "0.6";

/** Força mais baixa sem máscara: precisa manter o traço/posição, não reformular a imagem inteira. */
const COMPOSED_IMAGE_STRENGTH = "0.45";

export class StabilityProvider implements TattooSimulationProvider {
  readonly name = "stability";

  async simulate(req: SimulationRequest): Promise<SimulationResult> {
    if (!req.composedImageUrl) {
      // Mesma regra da Fal: sem a composição pronta não há como aplicar a arte
      // real — falha alto em vez de gerar uma tatuagem genérica não aprovada.
      throw new Error(
        "composedImageUrl ausente — a arte precisa estar composta na foto antes de chamar o provider.",
      );
    }
    // Checa a chave ANTES de baixar qualquer bytes: ao contrário da Fal (que
    // recebe URL e só falha por chave ausente dentro da própria chamada HTTP),
    // aqui precisamos baixar a imagem/máscara pra montar o multipart — sem
    // essa checagem cedo, uma composedImageUrl fake dispararia fetch de rede
    // de verdade antes do erro "chave ausente" aparecer.
    if (!process.env.STABILITY_API_KEY) {
      throw new Error("STABILITY_API_KEY não configurada");
    }

    const imageBlob = await fetchImageBytes(req.composedImageUrl, REQUEST_TIMEOUT_MS);
    const inpaintPath = process.env.STABILITY_INPAINT_ENDPOINT ?? DEFAULT_INPAINT_PATH;
    const i2iPath = process.env.STABILITY_I2I_ENDPOINT ?? DEFAULT_I2I_PATH;

    let base64: string;

    if (req.composedMaskUrl) {
      const maskBlob = await fetchImageBytes(req.composedMaskUrl, REQUEST_TIMEOUT_MS);
      const form = new FormData();
      form.set("image", imageBlob, "composed.png");
      form.set("mask", maskBlob, "mask.png");
      form.set("prompt", INPAINT_PROMPT);
      form.set("strength", INPAINT_STRENGTH);
      form.set("output_format", "png");
      base64 = await callStability({ path: inpaintPath, form, timeoutMs: REQUEST_TIMEOUT_MS });
    } else {
      const form = new FormData();
      form.set("image", imageBlob, "composed.png");
      form.set("prompt", NO_MASK_PROMPT);
      form.set("strength", COMPOSED_IMAGE_STRENGTH);
      form.set("mode", "image-to-image");
      form.set("output_format", "png");
      base64 = await callStability({ path: i2iPath, form, timeoutMs: REQUEST_TIMEOUT_MS });
    }

    const dataUri = `data:image/png;base64,${base64}`;

    // Hoje as 3 variantes apontam para a mesma imagem gerada, mesmo padrão da Fal.
    return {
      provider: this.name,
      costCents: ESTIMATED_COST_CENTS,
      variants: {
        small: dataUri,
        medium: dataUri,
        large: dataUri,
      },
    };
  }
}
