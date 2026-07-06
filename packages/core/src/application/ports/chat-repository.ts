export type MessageKind = "TEXT" | "AUDIO" | "IMAGE" | "PDF" | "VIDEO" | "SYSTEM";

export interface Conversation {
  id: string;
  studioId: string;
  orderId: string | null;
  clientId: string;
  artistId: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  kind: MessageKind;
  body: string | null;
  attachmentUrl: string | null;
  attachmentMeta: Record<string, unknown> | null;
  deliveredAt: Date | null;
  readAt: Date | null;
  createdAt: Date;
}

export interface CreateMessageData {
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  body?: string | null;
  attachmentUrl?: string | null;
  attachmentMeta?: Record<string, unknown> | null;
}

/** Página de mensagens: itens em ordem ascendente + se há mais antigas. */
export interface MessagePage {
  items: ChatMessage[];
  hasMore: boolean;
}

export interface ChatRepository {
  /** Cria (ou retorna) a conversa do pedido. Contexto de estúdio. */
  getOrCreateForOrder(order: {
    id: string;
    studioId: string;
    clientId: string;
    artistId: string;
  }): Promise<Conversation>;
  /**
   * As `take` mensagens mais RECENTES antes do cursor (paginação para trás),
   * devolvidas em ordem ascendente para renderização direta.
   */
  listMessages(
    conversationId: string,
    opts?: { take?: number; beforeId?: string },
  ): Promise<MessagePage>;
  createMessage(data: CreateMessageData): Promise<ChatMessage>;
  /** Marca como lidas as mensagens que o leitor NÃO enviou. Retorna quantas. */
  markRead(conversationId: string, readerUserId: string): Promise<number>;
}
