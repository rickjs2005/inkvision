import { Prisma, prisma, withStudio } from "@inkvision/db";
import type {
  ChatMessage,
  ChatRepository,
  Conversation,
  CreateMessageData,
  MessageKind,
  MessagePage,
} from "@inkvision/core";

function convToDomain(c: {
  id: string;
  studioId: string;
  orderId: string | null;
  clientId: string;
  artistId: string;
  createdAt: Date;
}): Conversation {
  return {
    id: c.id,
    studioId: c.studioId,
    orderId: c.orderId,
    clientId: c.clientId,
    artistId: c.artistId,
    createdAt: c.createdAt,
  };
}

/**
 * Conversation é tenant-privada (grupo STUDIO_OR_OWNER) — criada via withStudio.
 * Message não tem studioId (fora do RLS); o acesso é autorizado no caso de uso
 * ao resolver a conversa. senderName é resolvido em lote (Message não tem relação
 * com User no schema).
 */
export class PrismaChatRepository implements ChatRepository {
  async getOrCreateForOrder(order: {
    id: string;
    studioId: string;
    clientId: string;
    artistId: string;
  }): Promise<Conversation> {
    try {
      return await withStudio(order.studioId, async (tx) => {
        const existing = await tx.conversation.findFirst({ where: { orderId: order.id } });
        if (existing) return convToDomain(existing);
        const created = await tx.conversation.create({
          data: {
            studioId: order.studioId,
            orderId: order.id,
            clientId: order.clientId,
            artistId: order.artistId,
          },
        });
        return convToDomain(created);
      });
    } catch (e) {
      // Corrida: duas chamadas concorrentes (cliente e tatuador abrindo o
      // pedido quase ao mesmo tempo, por exemplo) tentaram criar a mesma
      // conversa. A transação que perdeu a corrida já foi ABORTADA pelo
      // Postgres nesse ponto — reler dentro dela (tx) sempre falha com
      // "current transaction is aborted" (25P02), mesmo pra um SELECT. Só
      // uma transação NOVA e limpa consegue reler o que a outra criou.
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const existing = await withStudio(order.studioId, (tx) =>
          tx.conversation.findFirst({ where: { orderId: order.id } }),
        );
        if (existing) return convToDomain(existing);
      }
      throw e;
    }
  }

  async listMessages(
    conversationId: string,
    opts?: { take?: number; beforeId?: string },
  ): Promise<MessagePage> {
    const take = opts?.take ?? 50;
    // Busca DESC (mais novas primeiro) com cursor para trás; +1 detecta se há
    // página anterior. Reverte para ascendente na saída.
    const rows = await prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(opts?.beforeId ? { cursor: { id: opts.beforeId }, skip: 1 } : {}),
    });
    const hasMore = rows.length > take;
    const page = rows.slice(0, take).reverse();
    return { items: await this.attachNames(page), hasMore };
  }

  async createMessage(data: CreateMessageData): Promise<ChatMessage> {
    const created = await prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        kind: data.kind,
        body: data.body ?? null,
        attachmentUrl: data.attachmentUrl ?? null,
        attachmentMeta: (data.attachmentMeta as Prisma.InputJsonValue) ?? undefined,
        deliveredAt: new Date(),
      },
    });
    const [msg] = await this.attachNames([created]);
    return msg!;
  }

  async markRead(conversationId: string, readerUserId: string): Promise<number> {
    const res = await prisma.message.updateMany({
      where: { conversationId, senderId: { not: readerUserId }, readAt: null },
      data: { readAt: new Date() },
    });
    return res.count;
  }

  private async attachNames(
    rows: {
      id: string;
      conversationId: string;
      senderId: string;
      kind: string;
      body: string | null;
      attachmentUrl: string | null;
      attachmentMeta: Prisma.JsonValue;
      deliveredAt: Date | null;
      readAt: Date | null;
      createdAt: Date;
    }[],
  ): Promise<ChatMessage[]> {
    const ids = [...new Set(rows.map((r) => r.senderId))];
    const users = ids.length
      ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.name]));
    return rows.map((r) => ({
      id: r.id,
      conversationId: r.conversationId,
      senderId: r.senderId,
      senderName: nameById.get(r.senderId) ?? "Usuário",
      kind: r.kind as MessageKind,
      body: r.body,
      attachmentUrl: r.attachmentUrl,
      attachmentMeta: (r.attachmentMeta as Record<string, unknown> | null) ?? null,
      deliveredAt: r.deliveredAt,
      readAt: r.readAt,
      createdAt: r.createdAt,
    }));
  }
}
