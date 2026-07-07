import { Queue, Worker, type ConnectionOptions } from "bullmq";
import { Redis } from "ioredis";
import { processSimulation, sendSessionReminders } from "./container";

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
export const REMINDERS_QUEUE = "reminders";
/** Cadência da varredura de lembretes — bem menor que as 24h de antecedência, então nenhuma sessão espera muito. */
const REMINDERS_SCAN_MS = 15 * 60_000;

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

  // Lembretes de sessão: o próprio worker é produtor (agenda o job repetido)
  // e consumidor (varre e envia). maxRetriesPerRequest: null é exigido pelo
  // BullMQ para a conexão do produtor (Queue).
  const remindersConnection = new Redis(REDIS_URL, { maxRetriesPerRequest: null }) as unknown as ConnectionOptions;
  const remindersQueue = new Queue(REMINDERS_QUEUE, { connection: remindersConnection });
  remindersQueue
    .upsertJobScheduler(REMINDERS_QUEUE, { every: REMINDERS_SCAN_MS }, { name: "scan" })
    .catch((err) => console.error("✗ falha ao agendar varredura de lembretes:", err.message));

  const remindersWorker = new Worker(
    REMINDERS_QUEUE,
    async () => sendSessionReminders.execute(),
    { connection: { url: REDIS_URL }, concurrency: 1 },
  );
  remindersWorker.on("completed", (_job, sent) => {
    if (sent > 0) console.log(`✓ lembretes: ${sent} e-mail(s) enviado(s)`);
  });
  remindersWorker.on("failed", (_job, err) => console.error("✗ varredura de lembretes falhou:", err.message));
  console.log(`⚡ worker: varrendo lembretes de sessão a cada ${REMINDERS_SCAN_MS / 60_000}min`);
}
