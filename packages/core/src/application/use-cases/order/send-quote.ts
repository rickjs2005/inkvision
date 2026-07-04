import { parseInput } from "../../validate";
import { type Actor } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import { assertTransition } from "../../../domain/order-state-machine";
import { sendQuoteSchema, type SendQuoteInput } from "../../dtos/order.dto";
import type { Order } from "../../ports/order-repository";
import { assertStudioSide, type OrderUseCaseDeps } from "./deps";

/**
 * Tatuador/gerente envia (ou revisa) o orçamento → estado QUOTED.
 * Notifica o cliente. Valores em reais convertidos para centavos.
 */
export class SendQuoteUseCase {
  constructor(private readonly deps: OrderUseCaseDeps) {}

  async execute(
    actor: Actor,
    studioId: string,
    orderId: string,
    rawInput: SendQuoteInput,
  ): Promise<Order> {
    const order = await this.deps.orders.findByIdForStudio(orderId, studioId);
    if (!order) throw new NotFoundError("Pedido");

    const artist = await this.deps.artists.findById(order.artistId);
    assertStudioSide(actor, order, artist);

    const input = parseInput(sendQuoteSchema, rawInput);
    assertTransition(order.status, "QUOTED");

    const updated = await this.deps.orders.transition(orderId, studioId, {
      from: order.status,
      to: "QUOTED",
      actorId: actor.userId,
      patch: {
        quoteAmountCents: Math.round(input.quoteAmount * 100),
        depositCents: Math.round(input.depositAmount * 100),
      },
      metadata: { quote: input.quoteAmount, deposit: input.depositAmount },
    });

    await this.deps.notifications.create({
      userId: order.clientId,
      type: "order.quoted",
      payload: { orderId, quoteCents: updated.quoteAmountCents },
    });
    await this.deps.audit.log({
      studioId,
      userId: actor.userId,
      action: "order.quoted",
      entity: "Order",
      entityId: orderId,
    });
    return updated;
  }
}
