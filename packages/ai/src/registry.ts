import type { TattooSimulationProvider } from "./ports";
import { FalProvider } from "./providers/fal";
import { MockAiProvider } from "./providers/mock";
import { RemoteProviderStub } from "./providers/remote-stub";
import { StabilityProvider } from "./providers/stability";

export type ProviderId = "mock" | "fal" | "replicate" | "openai" | "gemini" | "stability";

/**
 * Resolve o provider de simulação a partir de env (AI_SIMULATION_PROVIDER).
 * Trocar de provider = trocar a variável; nenhum caso de uso muda.
 */
export function getSimulationProvider(
  id: string = process.env.AI_SIMULATION_PROVIDER ?? "mock",
): TattooSimulationProvider {
  switch (id as ProviderId) {
    case "mock":
      return new MockAiProvider();
    case "fal":
      return new FalProvider();
    case "replicate":
      return new RemoteProviderStub("replicate", "REPLICATE_API_TOKEN");
    case "openai":
      return new RemoteProviderStub("openai", "OPENAI_API_KEY");
    case "gemini":
      return new RemoteProviderStub("gemini", "GEMINI_API_KEY");
    case "stability":
      return new StabilityProvider();
    default:
      return new MockAiProvider();
  }
}
