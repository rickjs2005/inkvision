export type SimulationJobStatus = "QUEUED" | "PROCESSING" | "DONE" | "FAILED";

export interface SimulationPlacement {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface SimulationVariants {
  small: string;
  medium: string;
  large: string;
}

export interface Simulation {
  id: string;
  orderId: string;
  studioId: string;
  designVersionId: string;
  designUrl: string;
  bodyPhotoUrl: string;
  placement: SimulationPlacement;
  variants: SimulationVariants | null;
  provider: string;
  status: SimulationJobStatus;
  errorMessage: string | null;
  createdAt: Date;
}

export interface CreateSimulationData {
  orderId: string;
  studioId: string;
  designVersionId: string;
  designUrl: string;
  bodyPhotoUrl: string;
  placement: SimulationPlacement;
  provider: string;
}

export interface SimulationRepository {
  create(data: CreateSimulationData): Promise<Simulation>;
  findById(id: string): Promise<Simulation | null>;
  getLatestForOrder(orderId: string): Promise<Simulation | null>;
  markProcessing(id: string): Promise<void>;
  markDone(id: string, variants: SimulationVariants, provider: string): Promise<Simulation>;
  markFailed(id: string, errorMessage: string): Promise<void>;
}
