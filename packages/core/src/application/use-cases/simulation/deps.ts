import type { TattooSimulationProvider } from "@inkvision/ai";
import { assertTransition, type OrderStatus } from "../../../domain/order-state-machine";
import type { ArtistRepository } from "../../ports/artist-repository";
import type { OrderRepository } from "../../ports/order-repository";
import type { DesignRepository } from "../../ports/design-repository";
import type { SimulationRepository } from "../../ports/simulation-repository";
import type {
  AiUsageRepository,
  RealtimePublisher,
  SimulationQueue,
} from "../../ports/ai-support";
import type { NotificationRepository } from "../../ports/notification-repository";

export interface SimulationUseCaseDeps {
  orders: OrderRepository;
  designs: DesignRepository;
  simulations: SimulationRepository;
  aiUsage: AiUsageRepository;
  queue: SimulationQueue;
  provider: TattooSimulationProvider;
  realtime: RealtimePublisher;
  artists: Pick<ArtistRepository, "findById">;
  notifications: NotificationRepository;
}

/**
 * Aplica uma sequência de transições no pedido (cada passo gera OrderEvent).
 * Ex.: DEPOSIT_PAID → IN_DESIGN → DESIGN_REVIEW.
 */
export async function advance(
  orders: OrderRepository,
  orderId: string,
  studioId: string,
  actorId: string,
  path: OrderStatus[],
): Promise<void> {
  for (let i = 0; i < path.length - 1; i++) {
    assertTransition(path[i]!, path[i + 1]!);
    await orders.transition(orderId, studioId, {
      from: path[i]!,
      to: path[i + 1]!,
      actorId,
    });
  }
}
