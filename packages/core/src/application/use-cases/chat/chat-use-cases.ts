import { parseInput } from "../../validate";
import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { sendMessageSchema, type SendMessageInput } from "../../dtos/chat.dto";
import type { ChatMessage, Conversation, MessagePage } from "../../ports/chat-repository";
import type { Order } from "../../ports/order-repository";
import { resolveClientOrder, resolveStudioOrder, type ChatUseCaseDeps } from "./deps";

/** Tamanho da página de mensagens (abertura e "carregar anteriores"). */
export const MESSAGES_PAGE_SIZE = 50;

export interface OpenConversationResult {
  order: Order;
  conversation: Conversation;
  /** Página mais recente, em ordem ascendente. */
  messages: ChatMessage[];
  /** Há mensagens mais antigas além desta página. */
  hasMoreMessages: boolean;
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
    const page = await this.deps.chat.listMessages(conversation.id, { take: MESSAGES_PAGE_SIZE });
    return { order, conversation, messages: page.items, hasMoreMessages: page.hasMore };
  }
}

/** Abre a conversa do pedido pelo lado do estúdio. */
export class OpenStudioConversationUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(actor: Actor, studioId: string, orderId: string): Promise<OpenConversationResult> {
    const { order, conversation } = await resolveStudioOrder(this.deps, actor, studioId, orderId);
    const page = await this.deps.chat.listMessages(conversation.id, { take: MESSAGES_PAGE_SIZE });
    return { order, conversation, messages: page.items, hasMoreMessages: page.hasMore };
  }
}

/** Cliente pagina para trás no histórico da conversa (autoriza como o open). */
export class ListOlderClientMessagesUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(actor: Actor | null, orderId: string, beforeId: string): Promise<MessagePage> {
    assertAuthenticated(actor);
    const { conversation } = await resolveClientOrder(this.deps, actor, orderId);
    return this.deps.chat.listMessages(conversation.id, { take: MESSAGES_PAGE_SIZE, beforeId });
  }
}

/** Estúdio pagina para trás no histórico da conversa (autoriza como o open). */
export class ListOlderStudioMessagesUseCase {
  constructor(private readonly deps: ChatUseCaseDeps) {}
  async execute(
    actor: Actor,
    studioId: string,
    orderId: string,
    beforeId: string,
  ): Promise<MessagePage> {
    const { conversation } = await resolveStudioOrder(this.deps, actor, studioId, orderId);
    return this.deps.chat.listMessages(conversation.id, { take: MESSAGES_PAGE_SIZE, beforeId });
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
        payload: { orderId, conversationId: conversation.id, artistId: artist!.id },
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
