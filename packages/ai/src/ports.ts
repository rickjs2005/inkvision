/**
 * Camada de IA plugável (ver docs/ARCHITECTURE.md §1.3). O restante do sistema
 * conhece SÓ estas interfaces — o provider concreto é resolvido pelo registry
 * a partir de env, sem que os casos de uso saibam qual é.
 */

export interface TattooPlacement {
  /** Posição relativa (0..1) do centro da arte sobre a foto. */
  x: number;
  y: number;
  /** Escala base (1 = tamanho de referência). */
  scale: number;
  /** Rotação em graus. */
  rotation: number;
}

export interface SimulationRequest {
  bodyPhotoUrl: string;
  designUrl: string;
  placement: TattooPlacement;
}

/** URLs das versões renderizadas por tamanho (P/M/G). */
export interface SimulationVariants {
  small: string;
  medium: string;
  large: string;
}

export interface SimulationResult {
  variants: SimulationVariants;
  provider: string;
  /** Custo estimado em centavos, quando o provider informa. */
  costCents?: number;
}

export interface TattooSimulationProvider {
  readonly name: string;
  simulate(req: SimulationRequest): Promise<SimulationResult>;
}
