import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "../domain/actor";
import type {
  ChatMessage,
  ChatRepository,
  Conversation,
  CreateMessageData,
} from "../application/ports/chat-repository";
import {
  ListOlderClientMessagesUseCase,
  MESSAGES_PAGE_SIZE,
  OpenClientConversationUseCase,
  SendClientMessageUseCase,
  SendStudioMessageUseCase,
} from "../application/use-cases/chat/chat-use-cases";
import { InMemoryArtistRepo } from "./fakes-artist";
import { InMemoryNotificationRepo, InMemoryOrderRepo } from "./fakes-order";

class InMemoryChatRepo implements ChatRepository {
  convs: Conversation[] = [];
  messages: ChatMessage[] = [];
  async getOrCreateForOrder(order: { id: string; studioId: string; clientId: string; artistId: string }) {
    let c = this.convs.find((x) => x.orderId === order.id);
    if (!c) {
      c = { id: `conv_${this.convs.length + 1}`, studioId: order.studioId, orderId: order.id, clientId: order.clientId, artistId: order.artistId, createdAt: new Date(0) };
      this.convs.push(c);
    }
    return c;
  }
  async listMessages(conversationId: string, opts?: { take?: number; beforeId?: string }) {
    const all = this.messages.filter((m) => m.conversationId === conversationId);
    const take = opts?.take ?? 50;
    const end = opts?.beforeId ? all.findIndex((m) => m.id === opts.beforeId) : all.length;
    const start = Math.max(0, end - take);
    return { items: all.slice(start, end), hasMore: start > 0 };
  }
  async createMessage(data: CreateMessageData) {
    const m: ChatMessage = {
      id: `m_${this.messages.length + 1}`,
      conversationId: data.conversationId,
      senderId: data.senderId,
      senderName: "User",
      kind: data.kind,
      body: data.body ?? null,
      attachmentUrl: data.attachmentUrl ?? null,
      attachmentMeta: data.attachmentMeta ?? null,
      deliveredAt: new Date(0),
      readAt: null,
      createdAt: new Date(0),
    };
    this.messages.push(m);
    return m;
  }
  async markRead() {
    return 0;
  }
}

const STUDIO = "studio_1";
const client: Actor = { userId: "u_client", platformRole: "USER", memberships: [] };
const artistActor: Actor = { userId: "u_artist", platformRole: "USER", memberships: [{ studioId: STUDIO, role: "ARTIST" }] };
const stranger: Actor = { userId: "u_x", platformRole: "USER", memberships: [] };

describe("chat", () => {
  let chat: InMemoryChatRepo;
  let orders: InMemoryOrderRepo;
  let artists: InMemoryArtistRepo;
  let notifications: InMemoryNotificationRepo;
  let orderId: string;

  beforeEach(async () => {
    chat = new InMemoryChatRepo();
    orders = new InMemoryOrderRepo();
    artists = new InMemoryArtistRepo();
    notifications = new InMemoryNotificationRepo();
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const order = await orders.create({
      studioId: STUDIO,
      clientId: "u_client",
      artistId: artist.id,
      bodyPart: "braço",
      briefing: "x".repeat(12),
      references: [],
    });
    orderId = order.id;
  });

  const deps = () => ({ chat, orders, artists, notifications });

  it("cliente envia mensagem e notifica o tatuador", async () => {
    const res = await new SendClientMessageUseCase(deps()).execute(client, orderId, {
      kind: "TEXT",
      body: "Olá!",
    });
    expect(res.message.senderId).toBe("u_client");
    expect(res.recipientUserId).toBe("u_artist");
    expect(await notifications.countUnread("u_artist")).toBe(1);
  });

  it("tatuador envia mensagem e notifica o cliente", async () => {
    const res = await new SendStudioMessageUseCase(deps()).execute(artistActor, STUDIO, orderId, {
      kind: "TEXT",
      body: "Fechado!",
    });
    expect(res.recipientUserId).toBe("u_client");
    expect(await notifications.countUnread("u_client")).toBe(1);
  });

  it("estranho não envia mensagem no pedido de outro", async () => {
    await expect(
      new SendClientMessageUseCase(deps()).execute(stranger, orderId, { kind: "TEXT", body: "oi" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      new SendStudioMessageUseCase(deps()).execute(stranger, STUDIO, orderId, { kind: "TEXT", body: "oi" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("paginação: abre com a página mais recente e carrega as anteriores", async () => {
    const send = new SendClientMessageUseCase(deps());
    const total = MESSAGES_PAGE_SIZE + 10;
    for (let i = 1; i <= total; i++) {
      await send.execute(client, orderId, { kind: "TEXT", body: `msg ${i}` });
    }

    const open = await new OpenClientConversationUseCase(deps()).execute(client, orderId);
    expect(open.messages).toHaveLength(MESSAGES_PAGE_SIZE);
    expect(open.hasMoreMessages).toBe(true);
    // A página aberta termina na mensagem mais NOVA (não trunca o fim).
    expect(open.messages.at(-1)!.body).toBe(`msg ${total}`);
    expect(open.messages[0]!.body).toBe("msg 11");

    const older = await new ListOlderClientMessagesUseCase(deps()).execute(
      client,
      orderId,
      open.messages[0]!.id,
    );
    expect(older.items).toHaveLength(10);
    expect(older.items[0]!.body).toBe("msg 1");
    expect(older.items.at(-1)!.body).toBe("msg 10");
    expect(older.hasMore).toBe(false);
  });

  it("rejeita mensagem de texto vazia", async () => {
    await expect(
      new SendClientMessageUseCase(deps()).execute(client, orderId, { kind: "TEXT", body: "   " }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
