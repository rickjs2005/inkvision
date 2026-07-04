import { parseInput } from "../../validate";
import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { sendMessageSchema, type SendMessageInput } from "../../dtos/chat.dto";
import type { ChatMessage, Conversation } from "../../ports/chat-repository";
import type { Order } from "../../ports/order-repository";
import { resolveClientOrder, resolveStudioOrder, type ChatUseCaseDeps } from "./deps";

export interface OpenConversationResult {
  order: Order;
  conversation: Conversation;
  messages: ChatMessage[];
}

export interface SendMessageResult {
  message: ChatMessage;
  conversationId: string;
  recipientUserId: string;
}

/** Abre a conversa do pedido pelo lado do cliente (cria se necessário). */
export class OpenClientConversationUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(actor: Actor | null, orderId: string): Promise<OpenConversationResult> {
    assertAuthenticated(actor);
    const { order, conversation } = await resolveClientOrder(this.deps, actor, orderId);
    const messages = await this.deps.chat.listMessages(conversation.id);
    return { order, conversation, messages };
  }
}

/** Abre a conversa do pedido pelo lado do estúdio. */
export class OpenStudioConversationUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(actor: Actor, studioId: string, orderId: string): Promise<OpenConversationResult> {
    const { order, conversation } = await resolveStudioOrder(this.deps, actor, studioId, orderId);
    const messages = await this.deps.chat.listMessages(conversation.id);
    return { order, conversation, messages };
  }
}

/** Cliente envia mensagem; destinatário é o tatuador. */
export class SendClientMessageUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(actor: Actor | null, orderId: string, rawInput: SendMessageInput): Promise<SendMessageResult> {
    assertAuthenticated(actor);
    const { order, conversation } = await resolveClientOrder(this.deps, actor, orderId);
    const input = parseInput(sendMessageSchema, rawInput);

    const message = await this.deps.chat.createMessage({
      conversationId: conversation.id,
      senderId: actor.userId,
      kind: input.kind,
      body: input.body ?? null,
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentMeta: input.attachmentMeta ?? null,
    });

    const artist = await this.deps.artists.findById(order.artistId);
    const recipientUserId = artist?.userId ?? "";
    if (recipientUserId) {
      await this.deps.notifications.create({
        userId: recipientUserId,
        type: "chat.message",
        payload: { orderId, conversationId: conversation.id },
      });
    }
    return { message, conversationId: conversation.id, recipientUserId };
  }
}

/** Estúdio (tatuador/gerente) envia mensagem; destinatário é o cliente. */
export class SendStudioMessageUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(
    actor: Actor,
    studioId: string,
    orderId: string,
    rawInput: SendMessageInput,
  ): Promise<SendMessageResult> {
    const { order, conversation } = await resolveStudioOrder(this.deps, actor, studioId, orderId);
    const input = parseInput(sendMessageSchema, rawInput);

    const message = await this.deps.chat.createMessage({
      conversationId: conversation.id,
      senderId: actor.userId,
      kind: input.kind,
      body: input.body ?? null,
      attachmentUrl: input.attachmentUrl ?? null,
      attachmentMeta: input.attachmentMeta ?? null,
    });

    await this.deps.notifications.create({
      userId: order.clientId,
      type: "chat.message",
      payload: { orderId, conversationId: conversation.id },
    });
    return { message, conversationId: conversation.id, recipientUserId: order.clientId };
  }
}

/** Marca mensagens como lidas (lado do cliente). */
export class MarkReadClientUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(actor: Actor | null, orderId: string): Promise<number> {
    assertAuthenticated(actor);
    const { conversation } = await resolveClientOrder(this.deps, actor, orderId);
    return this.deps.chat.markRead(conversation.id, actor.userId);
  }
}

/** Marca mensagens como lidas (lado do estúdio). */
export class MarkReadStudioUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(actor: Actor, studioId: string, orderId: string): Promise<number> {
    const { conversation } = await resolveStudioOrder(this.deps, actor, studioId, orderId);
    return this.deps.chat.markRead(conversation.id, actor.userId);
  }
}
