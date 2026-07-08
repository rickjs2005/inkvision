import type { SimulationRequest, SimulationResult, TattooSimulationProvider } from "../ports";

/**
 * Provider de IA para desenvolvimento. Não chama modelo nenhum: devolve a
 * imagem já composta pelo cliente (foto + arte posicionada, ver
 * `composedImageUrl`) como resultado — assim o dev sem FAL_API_KEY já vê a
 * tatuagem no lugar certo, só sem o refino fotorrealista da IA de verdade.
 * Sem composedImageUrl (chamada antiga/legado), cai de volta na foto crua.
 */
export class MockAiProvider implements TattooSimulationProvider {
  readonly name = "mock";

  async simulate(req: SimulationRequest): Promise<SimulationResult> {
    // Simula a latência de um modelo de imagem.
    await new Promise((r) => setTimeout(r, 400));
    const image = req.composedImageUrl ?? req.bodyPhotoUrl;
    return {
      provider: this.name,
      costCents: 0,
      variants: {
        small: image,
        medium: image,
        large: image,
      },
    };
  }
}
