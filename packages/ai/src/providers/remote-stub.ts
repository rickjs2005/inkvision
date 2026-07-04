import type { SimulationRequest, SimulationResult, TattooSimulationProvider } from "../ports";

/**
 * Stub para providers reais (Fal.ai, Replicate, OpenAI, Gemini, Stability).
 * A integração HTTP entra quando houver credenciais; hoje falha explicitamente
 * para deixar claro que o provider não está configurado (o dev usa "mock").
 *
 * O pipeline real (detectar pele → perspectiva/curvatura → warp da arte →
 * harmonizar luz/sombra/textura) é implementado por trás desta mesma interface.
 */
export class RemoteProviderStub implements TattooSimulationProvider {
  constructor(
    readonly name: string,
    private readonly apiKeyEnv: string,
  ) {}

  async simulate(_req: SimulationRequest): Promise<SimulationResult> {
    const key = process.env[this.apiKeyEnv];
    if (!key) {
      throw new Error(
        `Provider de IA "${this.name}" não configurado (${this.apiKeyEnv} ausente). Use AI_SIMULATION_PROVIDER=mock no dev.`,
      );
    }
    throw new Error(`Integração do provider "${this.name}" ainda não implementada.`);
  }
}
