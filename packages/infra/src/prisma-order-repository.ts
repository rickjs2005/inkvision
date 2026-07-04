import { Prisma, withStudio, withUser } from "@inkvision/db";
import type {
  CreateOrderData,
  Order,
  OrderRepository,
  TransitionInput,
} from "@inkvision/core";
import type { OrderStatus } from "@inkvision/core";

const orderInclude = {
  references: true,
  events: { orderBy: { createdAt: "asc" } },
  artist: { include: { user: { select: { name: true } } } },
  client: { select: { name: true } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function toDomain(o: OrderRow): Order {
  return {
    id: o.id,
    studioId: o.studioId,
    clientId: o.clientId,
    clientName: o.client.name,
    artistId: o.artistId,
    artistName: o.artist.user.name,
    styleId: o.styleId,
    bodyPart: o.bodyPart,
    approxSizeCm: o.approxSizeCm,
    briefing: o.briefing,
    status: o.status as OrderStatus,
    quoteAmountCents: o.quoteAmountCents,
    depositCents: o.depositCents,
    currency: o.currency,
    references: o.references.map((r) => ({ id: r.id, fileUrl: r.fileUrl, note: r.note })),
    events: o.events.map((e) => ({
      id: e.id,
      from: e.from as OrderStatus | null,
      to: e.to as OrderStatus,
      actorId: e.actorId,
      metadata: e.metadata,
      createdAt: e.createdAt,
    })),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export class PrismaOrderRepository implements OrderRepository {
  async create(data: CreateOrderData): Promise<Order> {
    const created = await withStudio(data.studioId, async (tx) => {
      const order = await tx.order.create({
        data: {
          studioId: data.studioId,
          clientId: data.clientId,
          artistId: data.artistId,
          styleId: data.styleId ?? null,
          bodyPart: data.bodyPart,
          approxSizeCm: data.approxSizeCm ?? null,
          briefing: data.briefing,
          status: "SUBMITTED",
          references: {
            create: data.references.map((r) => ({ fileUrl: r.fileUrl, note: r.note ?? null })),
          },
          events: { create: { to: "SUBMITTED", actorId: data.clientId } },
        },
        include: orderInclude,
      });
      return order;
    });
    return toDomain(created);
  }

  async findByIdForStudio(orderId: string, studioId: string): Promise<Order | null> {
    const o = await withStudio(studioId, (tx) =>
      tx.order.findFirst({ where: { id: orderId }, include: orderInclude }),
    );
    return o ? toDomain(o) : null;
  }

  async findByIdForClient(orderId: string, clientId: string): Promise<Order | null> {
    const o = await withUser(clientId, (tx) =>
      tx.order.findFirst({ where: { id: orderId, clientId }, include: orderInclude }),
    );
    return o ? toDomain(o as OrderRow) : null;
  }

  async listForClient(clientId: string): Promise<Order[]> {
    const rows = await withUser(clientId, (tx) =>
      tx.order.findMany({ where: { clientId }, include: orderInclude, orderBy: { createdAt: "desc" } }),
    );
    return (rows as OrderRow[]).map(toDomain);
  }

  async listForArtist(artistId: string, studioId: string): Promise<Order[]> {
    const rows = await withStudio(studioId, (tx) =>
      tx.order.findMany({ where: { artistId }, include: orderInclude, orderBy: { createdAt: "desc" } }),
    );
    return rows.map(toDomain);
  }

  async transition(orderId: string, studioId: string, input: TransitionInput): Promise<Order> {
    const updated = await withStudio(studioId, async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: input.to,
          ...(input.patch?.quoteAmountCents != null
            ? { quoteAmountCents: input.patch.quoteAmountCents }
            : {}),
          ...(input.patch?.depositCents != null ? { depositCents: input.patch.depositCents } : {}),
          events: {
            create: {
              from: input.from,
              to: input.to,
              actorId: input.actorId,
              metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
            },
          },
        },
      });
      return tx.order.findFirst({ where: { id: orderId }, include: orderInclude });
    });
    return toDomain(updated!);
  }
}
