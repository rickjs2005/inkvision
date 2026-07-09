import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import { assertTransition } from "../../../domain/order-state-machine";
import type { Order } from "../../ports/order-repository";
import type { OrderUseCaseDeps } from "./deps";

/**
 * Cliente aceita o orçamento → DEPOSIT_PENDING (o pagamento do sinal entra na
 * Sprint 6). Notifica o tatuador.
 */
export class AcceptQuoteUseCase {
  constructor(private readonly deps: OrderUseCaseDeps) {}

  async execute(actor: Actor | null, orderId: string): Promise<Order> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    assertTransition(order.status, "DEPOSIT_PENDING");

    const updated = await this.deps.orders.transition(orderId, order.studioId, {
      from: order.status,
      to: "DEPOSIT_PENDING",
      actorId: actor.userId,
    });

    const artist = await this.deps.artists.findById(order.artistId);
    if (artist) {
      await this.deps.notifications.create({
        userId: artist.userId,
        type: "order.accepted",
        payload: { orderId, artistId: artist.id },
      });
    }
    return updated;
  }
}

/** Cliente cancela o pedido (estados iniciais). */
export class CancelOrderUseCase {
  constructor(private readonly deps: OrderUseCaseDeps) {}

  async execute(actor: Actor | null, orderId: string): Promise<Order> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    assertTransition(order.status, "CANCELLED");

    const updated = await this.deps.orders.transition(orderId, order.studioId, {
      from: order.status,
      to: "CANCELLED",
      actorId: actor.userId,
      metadata: { by: "client" },
    });

    const artist = await this.deps.artists.findById(order.artistId);
    if (artist) {
      await this.deps.notifications.create({
        userId: artist.userId,
        type: "order.cancelled",
        payload: { orderId, artistId: artist.id },
      });
    }
    return updated;
  }
}

/** Leitura de detalhe conforme o lado (cliente dono ou estúdio). */
export class GetOrderForClientUseCase {
  constructor(private readonly deps: Pick<OrderUseCaseDeps, "orders">) {}
  async execute(actor: Actor | null, orderId: string): Promise<Order> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    return order;
  }
}

export class ListClientOrdersUseCase {
  constructor(private readonly deps: Pick<OrderUseCaseDeps, "orders">) {}
  async execute(actor: Actor | null): Promise<Order[]> {
    assertAuthenticated(actor);
    return this.deps.orders.listForClient(actor.userId);
  }
}
