import type { SimulationRequest, SimulationResult, TattooSimulationProvider } from "../ports";

/**
 * Provider de IA para desenvolvimento. Não composita bytes: devolve a própria
 * foto do corpo como base das variantes e sinaliza `provider: "mock"` para que a
 * UI sobreponha o desenho (com o placement e a escala P/M/G) via canvas/CSS.
 * Um provider real (Fal/Replicate) retornaria URLs de imagens já compostas.
 */
export class MockAiProvider implements TattooSimulationProvider {
  readonly name = "mock";

  async simulate(req: SimulationRequest): Promise<SimulationResult> {
    // Simula a latência de um modelo de imagem.
    await new Promise((r) => setTimeout(r, 400));
    return {
      provider: this.name,
      costCents: 0,
      variants: {
        small: req.bodyPhotoUrl,
        medium: req.bodyPhotoUrl,
        large: req.bodyPhotoUrl,
      },
    };
  }
}
