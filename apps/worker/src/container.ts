import { ProcessSimulationUseCase, SendSessionRemindersUseCase, type SimulationQueue } from "@inkvision/core";
import { getSimulationProvider } from "@inkvision/ai";
import {
  HttpRealtimePublisher,
  MockEmailService,
  PrismaAiUsageRepository,
  PrismaArtistRepository,
  PrismaDesignRepository,
  PrismaNotificationRepository,
  PrismaOrderRepository,
  PrismaScheduleRepository,
  PrismaSimulationRepository,
  PrismaUserRepository,
  ResendEmailService,
} from "@inkvision/infra";

/** Fila no-op: no worker o enqueue nunca é chamado (ele só consome). */
const noopQueue: SimulationQueue = { async enqueue() {} };

const artists = new PrismaArtistRepository();
const orders = new PrismaOrderRepository();

const deps = {
  orders,
  designs: new PrismaDesignRepository(),
  simulations: new PrismaSimulationRepository(),
  aiUsage: new PrismaAiUsageRepository(),
  queue: noopQueue,
  provider: getSimulationProvider(),
  realtime: new HttpRealtimePublisher(),
  artists,
  notifications: new PrismaNotificationRepository(),
};

export const processSimulation = new ProcessSimulationUseCase(deps);

export const sendSessionReminders = new SendSessionRemindersUseCase({
  schedule: new PrismaScheduleRepository(),
  orders,
  artists,
  users: new PrismaUserRepository(),
  email: process.env.RESEND_API_KEY ? new ResendEmailService() : new MockEmailService(),
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  now: () => new Date(),
});
