import { Worker } from "bullmq";
import { processSimulation } from "./container";

/**
 * Worker BullMQ (produção). Consome a fila "simulation" e processa os jobs de
 * IA com o mesmo caso de uso do web. No dev optamos por processamento
 * in-process (o web roda o job após a resposta), então sem REDIS_URL este
 * processo apenas informa e fica ocioso.
 *
 * Reforço: com REDIS_URL definido e o web publicando na fila (em vez de
 * in-process), este worker passa a processar de forma distribuída.
 */
const REDIS_URL = process.env.REDIS_URL;

export const SIMULATION_QUEUE = "simulation";

if (!REDIS_URL) {
  console.log("⚙️  worker: REDIS_URL ausente — modo dev in-process (web processa os jobs). Ocioso.");
} else {
  const worker = new Worker(
    SIMULATION_QUEUE,
    async (job) => {
      const { simulationId } = job.data as { simulationId: string };
      await processSimulation.execute(simulationId);
    },
    { connection: { url: REDIS_URL }, concurrency: 4 },
  );

  worker.on("completed", (job) => console.log(`✓ simulação ${job.id} processada`));
  worker.on("failed", (job, err) => console.error(`✗ simulação ${job?.id} falhou:`, err.message));
  console.log("⚡ worker: consumindo a fila 'simulation' via BullMQ");
}
