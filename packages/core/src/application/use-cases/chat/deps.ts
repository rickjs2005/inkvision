import { type Actor, isPlatformAdmin, membershipIn } from "../../../domain/actor";
import { ForbiddenError, NotFoundError } from "../../../domain/errors";
import type { ArtistRepository } from "../../ports/artist-repository";
import type { ChatRepository, Conversation } from "../../ports/chat-repository";
import type { Order, OrderRepository } from "../../ports/order-repository";
import type { NotificationRepository } from "../../ports/notification-repository";

export interface ChatUseCaseDeps {
  chat: ChatRepository;
  orders: OrderRepository;
  artists: Pick<ArtistRepository, "findById">;
  notifications: NotificationRepository;
}

/** Carrega pedido + conversa no contexto do cliente dono. */
export async function resolveClientOrder(
  deps: ChatUseCaseDeps,
  actor: Actor,
  orderId: string,
): Promise<{ order: Order; conversation: Conversation }> {
  const order = await deps.orders.findByIdForClient(orderId, actor.userId);
  if (!order) throw new NotFoundError("Pedido");
  const conversation = await deps.chat.getOrCreateForOrder(order);
  return { order, conversation };
}

/** Carrega pedido + conversa no contexto de estúdio (membro/admin). */
export async function resolveStudioOrder(
  deps: ChatUseCaseDeps,
  actor: Actor,
  studioId: string,
  orderId: string,
): Promise<{ order: Order; conversation: Conversation }> {
  if (!isPlatformAdmin(actor) && !membershipIn(actor, studioId)) throw new ForbiddenError();
  const order = await deps.orders.findByIdForStudio(orderId, studioId);
  if (!order) throw new NotFoundError("Pedido");
  const conversation = await deps.chat.getOrCreateForOrder(order);
  return { order, conversation };
}
