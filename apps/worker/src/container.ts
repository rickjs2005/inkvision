import { ProcessSimulationUseCase, type SimulationQueue } from "@inkvision/core";
import { getSimulationProvider } from "@inkvision/ai";
import {
  HttpRealtimePublisher,
  PrismaAiUsageRepository,
  PrismaArtistRepository,
  PrismaDesignRepository,
  PrismaNotificationRepository,
  PrismaOrderRepository,
  PrismaSimulationRepository,
} from "@inkvision/infra";

/** Fila no-op: no worker o enqueue nunca é chamado (ele só consome). */
const noopQueue: SimulationQueue = { async enqueue() {} };

const deps = {
  orders: new PrismaOrderRepository(),
  designs: new PrismaDesignRepository(),
  simulations: new PrismaSimulationRepository(),
  aiUsage: new PrismaAiUsageRepository(),
  queue: noopQueue,
  provider: getSimulationProvider(),
  realtime: new HttpRealtimePublisher(),
  artists: new PrismaArtistRepository(),
  notifications: new PrismaNotificationRepository(),
};

export const processSimulation = new ProcessSimulationUseCase(deps);
