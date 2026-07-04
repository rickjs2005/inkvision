import type {
  CreateOrderData,
  Order,
  OrderRepository,
  TransitionInput,
} from "../application/ports/order-repository";
import type {
  Notification,
  NotificationData,
  NotificationRepository,
} from "../application/ports/notification-repository";

let seq = 0;
const id = (p: string) => `${p}_${(++seq).toString(36)}`;

export class InMemoryOrderRepo implements OrderRepository {
  orders: Order[] = [];

  async create(data: CreateOrderData): Promise<Order> {
    const order: Order = {
      id: id("order"),
      studioId: data.studioId,
      clientId: data.clientId,
      artistId: data.artistId,
      styleId: data.styleId ?? null,
      bodyPart: data.bodyPart,
      approxSizeCm: data.approxSizeCm ?? null,
      briefing: data.briefing,
      status: "SUBMITTED",
      quoteAmountCents: null,
      depositCents: null,
      currency: "BRL",
      references: data.references.map((r, i) => ({ id: `ref_${i}`, fileUrl: r.fileUrl, note: r.note ?? null })),
      events: [{ id: id("evt"), from: null, to: "SUBMITTED", actorId: data.clientId, createdAt: new Date(0) }],
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
    this.orders.push(order);
    return order;
  }
  async findByIdForStudio(orderId: string, studioId: string) {
    return this.orders.find((o) => o.id === orderId && o.studioId === studioId) ?? null;
  }
  async findByIdForClient(orderId: string, clientId: string) {
    return this.orders.find((o) => o.id === orderId && o.clientId === clientId) ?? null;
  }
  async listForClient(clientId: string) {
    return this.orders.filter((o) => o.clientId === clientId);
  }
  async listForArtist(artistId: string, studioId: string) {
    return this.orders.filter((o) => o.artistId === artistId && o.studioId === studioId);
  }
  async transition(orderId: string, _studioId: string, input: TransitionInput) {
    const o = this.orders.find((x) => x.id === orderId)!;
    o.status = input.to;
    if (input.patch?.quoteAmountCents != null) o.quoteAmountCents = input.patch.quoteAmountCents;
    if (input.patch?.depositCents != null) o.depositCents = input.patch.depositCents;
    o.events.push({ id: id("evt"), from: input.from, to: input.to, actorId: input.actorId, createdAt: new Date(0) });
    return o;
  }
}

export class InMemoryNotificationRepo implements NotificationRepository {
  items: (NotificationData & { id: string; readAt: Date | null })[] = [];
  async create(data: NotificationData) {
    this.items.push({ ...data, id: id("ntf"), readAt: null });
  }
  async createMany(data: NotificationData[]) {
    for (const d of data) await this.create(d);
  }
  async listForUser(userId: string): Promise<Notification[]> {
    return this.items
      .filter((n) => n.userId === userId)
      .map((n) => ({ id: n.id, type: n.type, payload: n.payload, readAt: n.readAt, createdAt: new Date(0) }));
  }
  async countUnread(userId: string) {
    return this.items.filter((n) => n.userId === userId && n.readAt === null).length;
  }
  async markRead(userId: string) {
    this.items.filter((n) => n.userId === userId).forEach((n) => (n.readAt = new Date(0)));
  }
}
