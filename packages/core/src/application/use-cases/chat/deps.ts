import { type Actor } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import type { ArtistRepository } from "../../ports/artist-repository";
import type { ChatRepository, Conversation } from "../../ports/chat-repository";
import type { Order, OrderRepository } from "../../ports/order-repository";
import type { NotificationRepository } from "../../ports/notification-repository";
import { assertStudioSide } from "../order/deps";

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

/**
 * Carrega pedido + conversa no contexto de estúdio: só o tatuador DESIGNADO no
 * pedido, ou manager+/admin — nunca "qualquer membro do estúdio". Sem isso, um
 * ARTIST comum conseguia ler/escrever no chat de pedidos de outros colegas
 * (achado de pentest: broken access control intra-tenant).
 */
export async function resolveStudioOrder(
  deps: ChatUseCaseDeps,
  actor: Actor,
  studioId: string,
  orderId: string,
): Promise<{ order: Order; conversation: Conversation }> {
  const order = await deps.orders.findByIdForStudio(orderId, studioId);
  if (!order) throw new NotFoundError("Pedido");
  const artist = await deps.artists.findById(order.artistId);
  assertStudioSide(actor, order, artist);
  const conversation = await deps.chat.getOrCreateForOrder(order);
  return { order, conversation };
}
