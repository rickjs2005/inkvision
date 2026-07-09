import type { SimulationRequest, SimulationResult, TattooSimulationProvider } from "../ports";

/**
 * Provider REAL de simulação usando a Fal.ai (https://fal.ai).
 *
 * Faz uma chamada HTTP direta (fetch nativo — sem dependências npm) a um modelo
 * de image-to-image e usa a imagem resultante como base das variantes.
 *
 * O "pipeline real" de tatuagem (detectar pele → perspectiva/curvatura do corpo →
 * warp da arte → harmonizar luz/sombra/textura) NÃO vive aqui em código: ele é
 * responsabilidade do modelo + prompt. Evoluir a qualidade = trocar o modelo,
 * refinar o prompt ou encadear passos (ex.: segmentação + inpainting) — tudo
 * por trás desta mesma interface, sem que os casos de uso mudem.
 */

/** Modelo img2img default da Fal. Pode ser sobrescrito por env FAL_MODEL. */
const DEFAULT_MODEL = "fal-ai/flux/dev/image-to-image";

/** Modelo de inpainting default da Fal. Sobrescrito por env FAL_INPAINT_MODEL. */
const DEFAULT_INPAINT_MODEL = "fal-ai/flux-general/inpainting";

/** Timeout da chamada ao modelo (imagens costumam levar dezenas de segundos). */
const REQUEST_TIMEOUT_MS = 60_000;

/** Custo estimado por simulação, em centavos (placeholder até termos billing real). */
const ESTIMATED_COST_CENTS = 5;

export interface FalImageToImageInput {
  /** URL pública OU data URI base64 da imagem de entrada. */
  imageUrl: string;
  prompt: string;
  /** 0..1 — quanto o modelo pode transformar a entrada (default do modelo). */
  strength?: number;
  model?: string;
  timeoutMs?: number;
}

/** Chamada bruta a um modelo da Fal; extrai a URL da imagem resultante. */
async function callFalModel(
  model: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<string> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_API_KEY não configurada");
  }

  let response: Response;
  try {
    response = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    // Timeout / rede: normaliza para uma mensagem clara.
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Falha ao chamar a Fal.ai (${model}): ${reason}`);
  }

  if (response.status !== 200) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Fal.ai retornou status ${response.status} (${model}): ${detail || response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    images?: Array<{ url?: string }>;
    image?: { url?: string };
  };

  // A Fal (modelos flux img2img/inpainting) retorna 1 imagem; extraímos a URL.
  const imageUrl = data.images?.[0]?.url ?? data.image?.url;
  if (!imageUrl) {
    throw new Error(`Fal.ai não retornou imagem (${model}).`);
  }
  return imageUrl;
}

/**
 * Chamada de image-to-image na Fal (sem máscara — transforma a imagem
 * inteira). Usada pela rota pública do /simular. Retorna a URL da imagem.
 */
export async function falImageToImage(input: FalImageToImageInput): Promise<string> {
  const model = input.model ?? process.env.FAL_MODEL ?? DEFAULT_MODEL;
  return callFalModel(
    model,
    {
      image_url: input.imageUrl,
      prompt: input.prompt,
      ...(input.strength !== undefined ? { strength: input.strength } : {}),
    },
    input.timeoutMs ?? REQUEST_TIMEOUT_MS,
  );
}

export interface FalInpaintInput {
  /** URL pública OU data URI base64 da imagem de entrada (foto + arte já compostas). */
  imageUrl: string;
  /** URL da máscara: branco = área que a IA pode repintar, preto = preservar. */
  maskUrl: string;
  prompt: string;
  /** 0..1 — quanto a IA pode transformar a área da máscara (default do modelo). */
  strength?: number;
  model?: string;
  timeoutMs?: number;
}

/**
 * Chamada de inpainting na Fal: só os pixels dentro de `maskUrl` podem ser
 * alterados — o resto da imagem (roupa, rosto, outras tatuagens) é preservado
 * pela arquitetura do modelo, não só por instrução de prompt. É isso que dá
 * garantia real de fidelidade ao desenho escolhido, ao contrário do
 * `falImageToImage` (img2img puro), que reformula a imagem inteira.
 */
export async function falInpaint(input: FalInpaintInput): Promise<string> {
  const model = input.model ?? process.env.FAL_INPAINT_MODEL ?? DEFAULT_INPAINT_MODEL;
  return callFalModel(
    model,
    {
      image_url: input.imageUrl,
      mask_url: input.maskUrl,
      prompt: input.prompt,
      ...(input.strength !== undefined ? { strength: input.strength } : {}),
    },
    input.timeoutMs ?? REQUEST_TIMEOUT_MS,
  );
}

/**
 * Transformação da imagem já composta quando NÃO há máscara (fallback) —
 * baixa o suficiente para não destruir o traço/posição escolhido, alta o
 * suficiente para a Fal reformular textura/luz/sombra por cima.
 */
const COMPOSED_IMAGE_STRENGTH = 0.45;

/**
 * Força de repintura DENTRO da área da máscara. Pode ser mais alta que o
 * fallback sem máscara: fora da máscara a foto já está 100% preservada pela
 * arquitetura do inpainting, então dar mais liberdade dentro dela só ajuda o
 * realismo (pele, sombra) sem risco de a IA alterar o resto da imagem.
 */
const INPAINT_STRENGTH = 0.6;

export class FalProvider implements TattooSimulationProvider {
  readonly name = "fal";

  async simulate(req: SimulationRequest): Promise<SimulationResult> {
    if (!req.composedImageUrl) {
      // Sem a composição pronta (chamada antiga/legado), não há como aplicar a
      // arte real — falha alto em vez de gerar uma tatuagem genérica que não é
      // a que o cliente aprovou.
      throw new Error(
        "composedImageUrl ausente — a arte precisa estar composta na foto antes de chamar o provider.",
      );
    }

    // Com máscara: inpainting — só os pixels da área do desenho podem mudar,
    // o resto da foto (roupa, rosto, outras tatuagens) é preservado pela
    // arquitetura do modelo. É a única forma real de GARANTIR fidelidade ao
    // desenho escolhido; sem máscara, um img2img puro pode reformular a foto
    // inteira (achado real de teste manual: reinterpretou o desenho e alterou
    // roupa/rosto numa foto com bastante detalhe).
    if (req.composedMaskUrl) {
      const prompt =
        "Inside the masked area only: turn the tattoo design already composited there into a " +
        "photorealistic, healed tattoo. Keep the design's exact shape unchanged, follow the body's " +
        "curvature and perspective, match the real skin tone, lighting, shadows and pores, and blend " +
        "the ink naturally so it looks like a real tattoo on the skin — not a sticker.";

      const imageUrl = await falInpaint({
        imageUrl: req.composedImageUrl,
        maskUrl: req.composedMaskUrl,
        prompt,
        strength: INPAINT_STRENGTH,
      });

      return {
        provider: this.name,
        costCents: ESTIMATED_COST_CENTS,
        variants: { small: imageUrl, medium: imageUrl, large: imageUrl },
      };
    }

    // A arte JÁ ESTÁ nos pixels da imagem enviada (composta no cliente, mesma
    // técnica do /simular público) — o prompt só pede pra IA refinar o que já
    // está lá, sem reformular texto de posição/escala que o modelo não segue.
    const prompt =
      "This photo already shows a tattoo design composited onto the person's skin, in the exact " +
      "position, scale and rotation intended. Refine it into a photorealistic, healed tattoo: " +
      "keep the design's exact shape and position unchanged, follow the body's curvature and " +
      "perspective, match the real skin tone, lighting, shadows and pores, and blend the ink " +
      "naturally so it looks like a real tattoo on the skin — not a sticker. " +
      "Do not add, remove or move anything else in the image.";

    const imageUrl = await falImageToImage({
      imageUrl: req.composedImageUrl,
      prompt,
      strength: COMPOSED_IMAGE_STRENGTH,
    });

    // Hoje as 3 variantes apontam para a mesma imagem gerada. P/M/G podem, no
    // futuro, variar por parâmetro (ex.: reexecutar o modelo alterando o `scale`
    // do placement, ou pós-processar a arte em diferentes tamanhos).
    return {
      provider: this.name,
      costCents: ESTIMATED_COST_CENTS,
      variants: {
        small: imageUrl,
        medium: imageUrl,
        large: imageUrl,
      },
    };
  }
}
