import { Queue, type ConnectionOptions } from "bullmq";
import { Redis } from "ioredis";
import type { SimulationQueue } from "@inkvision/core";

export const SIMULATION_QUEUE = "simulation";

/**
 * Fila de simulação distribuída (produção). Publica os jobs no Redis via BullMQ;
 * o apps/worker consome. Durável e escalável — substitui o fallback in-process do
 * dev quando REDIS_URL está definido.
 */
export class BullMqSimulationQueue implements SimulationQueue {
  private readonly queue: Queue;

  constructor(redisUrl = process.env.REDIS_URL!) {
    // maxRetriesPerRequest: null é exigido pelo BullMQ para a conexão do produtor.
    // Cast: pnpm pode duplicar o tipo de ioredis entre bullmq e a dep direta;
    // em runtime é a mesma classe. A conexão é uma instância ioredis válida.
    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null }) as unknown as ConnectionOptions;
    this.queue = new Queue(SIMULATION_QUEUE, { connection });
  }

  async enqueue(simulationId: string): Promise<void> {
    await this.queue.add(
      "simulate",
      { simulationId },
      { attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 500, removeOnFail: 1000 },
    );
  }
}
