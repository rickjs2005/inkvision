import { withStudio } from "@inkvision/db";
import type {
  CreatePaymentData,
  Payment,
  PaymentKind,
  PaymentRepository,
  PaymentStatus,
} from "@inkvision/core";

function toDomain(p: {
  id: string;
  studioId: string;
  orderId: string;
  kind: string;
  amountCents: number;
  feeCents: number;
  stripePaymentIntentId: string;
  status: string;
  createdAt: Date;
}): Payment {
  return {
    id: p.id,
    studioId: p.studioId,
    orderId: p.orderId,
    kind: p.kind as PaymentKind,
    amountCents: p.amountCents,
    feeCents: p.feeCents,
    providerRef: p.stripePaymentIntentId,
    status: p.status as PaymentStatus,
    createdAt: p.createdAt,
  };
}

/** Payment é studio-scoped (RLS studio-only) — tudo via withStudio. */
export class PrismaPaymentRepository implements PaymentRepository {
  async createPending(data: CreatePaymentData): Promise<Payment> {
    const created = await withStudio(data.studioId, (tx) =>
      tx.payment.create({
        data: {
          studioId: data.studioId,
          orderId: data.orderId,
          kind: data.kind,
          amountCents: data.amountCents,
          feeCents: data.feeCents,
          stripePaymentIntentId: data.providerRef,
          status: "PENDING",
        },
      }),
    );
    return toDomain(created);
  }

  async findPendingForOrder(
    studioId: string,
    orderId: string,
    kind: PaymentKind,
  ): Promise<Payment | null> {
    const p = await withStudio(studioId, (tx) =>
      tx.payment.findFirst({ where: { orderId, kind, status: "PENDING" } }),
    );
    return p ? toDomain(p) : null;
  }

  async markSucceeded(studioId: string, paymentId: string): Promise<Payment> {
    // CAS: só marca SUCCEEDED se ainda estiver PENDING — evita dois webhooks
    // reentrantes do Stripe para o mesmo pagamento disputando a mesma escrita
    // (ver comentário equivalente em PrismaOrderRepository.transition).
    const p = await withStudio(studioId, async (tx) => {
      await tx.payment.updateMany({
        where: { id: paymentId, status: "PENDING" },
        data: { status: "SUCCEEDED" },
      });
      return tx.payment.findUniqueOrThrow({ where: { id: paymentId } });
    });
    return toDomain(p);
  }

  async listForOrder(studioId: string, orderId: string): Promise<Payment[]> {
    const rows = await withStudio(studioId, (tx) =>
      tx.payment.findMany({ where: { orderId }, orderBy: { createdAt: "asc" } }),
    );
    return rows.map(toDomain);
  }
}
