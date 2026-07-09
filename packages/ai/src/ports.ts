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
  /**
   * Foto do corpo + arte já compostas (canvas) na posição/escala/rotação
   * escolhidas pelo cliente. Quando presente, é ISSO que deve ir ao modelo de
   * image-to-image — a arte já está nos pixels, não precisa (e não deve) ser
   * referenciada só por texto no prompt.
   */
  composedImageUrl?: string;
  /**
   * Máscara binária (branco = área a repintar, preto = preservar) na mesma
   * posição/escala/rotação da arte. Com ela, um provider de inpainting só
   * pode alterar pixels dentro do desenho colado — o resto da foto (roupa,
   * rosto, outras tatuagens) fica preservado por arquitetura, não só por
   * instrução de prompt.
   */
  composedMaskUrl?: string;
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
