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

/**
 * Chamada bruta de image-to-image na Fal. Compartilhada entre o FalProvider
 * (fluxo autenticado) e a rota pública do /simular. Retorna a URL da imagem.
 */
export async function falImageToImage(input: FalImageToImageInput): Promise<string> {
  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) {
    throw new Error("FAL_API_KEY não configurada");
  }
  const model = input.model ?? process.env.FAL_MODEL ?? DEFAULT_MODEL;

  let response: Response;
  try {
    response = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: input.imageUrl,
        prompt: input.prompt,
        ...(input.strength !== undefined ? { strength: input.strength } : {}),
      }),
      signal: AbortSignal.timeout(input.timeoutMs ?? REQUEST_TIMEOUT_MS),
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

  // A Fal (modelos flux img2img) retorna 1 imagem; extraímos a URL resultante.
  const imageUrl = data.images?.[0]?.url ?? data.image?.url;
  if (!imageUrl) {
    throw new Error(`Fal.ai não retornou imagem (${model}).`);
  }
  return imageUrl;
}

export class FalProvider implements TattooSimulationProvider {
  readonly name = "fal";

  async simulate(req: SimulationRequest): Promise<SimulationResult> {
    const { x, y, scale, rotation } = req.placement;

    // O prompt carrega a "intenção" do pipeline: aplicar a arte na pele de forma
    // realista, respeitando o placement informado. Referenciamos a arte pela URL
    // (o modelo/prompt evolui para receber a arte como segunda imagem/condição).
    const prompt =
      "Apply the given tattoo design realistically onto the person's skin in the photo. " +
      `Reference tattoo design: ${req.designUrl}. ` +
      `Place it at relative position x=${x.toFixed(2)}, y=${y.toFixed(2)} of the photo, ` +
      `scaled by ${scale} and rotated ${rotation} degrees. ` +
      "Follow the body's curvature and perspective, match the skin tone, lighting, shadows and pores, " +
      "and blend the ink naturally so it looks like a real tattoo on the skin.";

    const imageUrl = await falImageToImage({ imageUrl: req.bodyPhotoUrl, prompt });

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
