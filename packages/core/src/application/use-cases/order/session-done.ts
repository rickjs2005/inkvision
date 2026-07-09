import { type Actor } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import { assertTransition } from "../../../domain/order-state-machine";
import type { Order } from "../../ports/order-repository";
import { assertStudioSide, type OrderUseCaseDeps } from "./deps";

/**
 * Tatuador/gerente marca a sessão como realizada → SESSION_DONE. Ação própria
 * do estúdio, independente do pagamento final do cliente — sem ela, um
 * cliente que demora a pagar deixa o pedido travado em SCHEDULED para sempre.
 * O pagamento do valor final só é possível a partir de SESSION_DONE (ver
 * RULES em payment/order-payment.ts).
 */
export class MarkSessionDoneUseCase {
  constructor(private readonly deps: OrderUseCaseDeps) {}

  async execute(actor: Actor, studioId: string, orderId: string): Promise<Order> {
    const order = await this.deps.orders.findByIdForStudio(orderId, studioId);
    if (!order) throw new NotFoundError("Pedido");

    const artist = await this.deps.artists.findById(order.artistId);
    assertStudioSide(actor, order, artist);
    assertTransition(order.status, "SESSION_DONE");

    const updated = await this.deps.orders.transition(orderId, studioId, {
      from: order.status,
      to: "SESSION_DONE",
      actorId: actor.userId,
    });

    await this.deps.notifications.create({
      userId: order.clientId,
      type: "order.session_done",
      payload: { orderId },
    });
    await this.deps.audit.log({
      studioId,
      userId: actor.userId,
      action: "order.session_done",
      entity: "Order",
      entityId: orderId,
    });
    return updated;
  }
}
