/** Registra uso de IA (alimenta o dashboard admin e os limites de plano). */
export interface AiUsageRepository {
  log(input: {
    studioId: string;
    provider: string;
    operation: string;
    costCents?: number;
  }): Promise<void>;
}

/** Fila de jobs de simulação. Impl in-process (dev) ou BullMQ (prod). */
export interface SimulationQueue {
  enqueue(simulationId: string): Promise<void>;
}

/** Publica eventos em tempo real para um usuário (via serviço de realtime). */
export interface RealtimePublisher {
  toUser(userId: string, event: string, payload: unknown): Promise<void>;
}
