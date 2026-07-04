import { type Actor, isPlatformAdmin, membershipIn } from "../../../domain/actor";
import { ForbiddenError, NotFoundError } from "../../../domain/errors";
import type { Order } from "../../ports/order-repository";
import type { OrderUseCaseDeps } from "./deps";

function assertStudioMember(actor: Actor, studioId: string) {
  if (isPlatformAdmin(actor)) return;
  if (!membershipIn(actor, studioId)) throw new ForbiddenError();
}

/** Lista pedidos de um tatuador (contexto de estúdio). */
export class ListArtistOrdersUseCase {
  constructor(private readonly deps: Pick<OrderUseCaseDeps, "orders" | "artists">) {}
  async execute(actor: Actor, studioId: string, artistId: string): Promise<Order[]> {
    assertStudioMember(actor, studioId);
    return this.deps.orders.listForArtist(artistId, studioId);
  }
}

/** Detalhe do pedido no contexto de estúdio. */
export class GetOrderForStudioUseCase {
  constructor(private readonly deps: Pick<OrderUseCaseDeps, "orders">) {}
  async execute(actor: Actor, studioId: string, orderId: string): Promise<Order> {
    assertStudioMember(actor, studioId);
    const order = await this.deps.orders.findByIdForStudio(orderId, studioId);
    if (!order) throw new NotFoundError("Pedido");
    return order;
  }
}
