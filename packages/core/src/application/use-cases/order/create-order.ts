import { parseInput } from "../../validate";
import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { NotFoundError, ValidationError } from "../../../domain/errors";
import { createOrderSchema, type CreateOrderInput } from "../../dtos/order.dto";
import type { Order } from "../../ports/order-repository";
import type { OrderUseCaseDeps } from "./deps";

/**
 * Cliente cria um pedido para um tatuador. O studioId é derivado do artista
 * (nunca confiado do cliente). Estado inicial SUBMITTED; notifica o tatuador.
 */
export class CreateOrderUseCase {
  constructor(private readonly deps: OrderUseCaseDeps) {}

  async execute(actor: Actor | null, rawInput: CreateOrderInput): Promise<Order> {
    assertAuthenticated(actor);
    const input = parseInput(createOrderSchema, rawInput);

    const artist = await this.deps.artists.findById(input.artistId);
    if (!artist) throw new NotFoundError("Tatuador");
    if (!artist.isActive) throw new ValidationError("Este tatuador não está aceitando pedidos.");

    const order = await this.deps.orders.create({
      studioId: artist.studioId,
      clientId: actor.userId,
      artistId: artist.id,
      styleId: input.styleId ?? null,
      bodyPart: input.bodyPart,
      approxSizeCm: input.approxSizeCm ?? null,
      briefing: input.briefing,
      references: input.references,
    });

    await this.deps.notifications.create({
      userId: artist.userId,
      type: "order.submitted",
      payload: { orderId: order.id, clientId: actor.userId, artistId: artist.id },
    });
    await this.deps.audit.log({
      studioId: artist.studioId,
      userId: actor.userId,
      action: "order.created",
      entity: "Order",
      entityId: order.id,
    });
    return order;
  }
}
