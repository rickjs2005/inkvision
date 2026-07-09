import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { NotFoundError, ValidationError } from "../../../domain/errors";
import { assertTransition, type OrderStatus } from "../../../domain/order-state-machine";
import type { PaymentKind } from "../../ports/payment-gateway";
import type { Order } from "../../ports/order-repository";
import { feeFor, type PaymentUseCaseDeps } from "./deps";

/** Estado exigido e destino da transição por tipo de pagamento. */
const RULES: Record<PaymentKind, { requires: OrderStatus; to: OrderStatus }> = {
  DEPOSIT: { requires: "DEPOSIT_PENDING", to: "DEPOSIT_PAID" },
  // Exige SESSION_DONE (marcado pelo tatuador) — o cliente só paga o valor
  // final depois que a sessão de fato aconteceu, não só porque foi agendada.
  FINAL: { requires: "SESSION_DONE", to: "COMPLETED" },
};

function amountFor(kind: PaymentKind, order: Order): number {
  if (kind === "DEPOSIT") return order.depositCents ?? 0;
  return (order.quoteAmountCents ?? 0) - (order.depositCents ?? 0); // saldo final
}

/** Cliente inicia o pagamento (sinal ou final) — cria o checkout (mock). */
export class StartOrderPaymentUseCase {
  constructor(private readonly deps: PaymentUseCaseDeps) {}

  async execute(actor: Actor | null, orderId: string, kind: PaymentKind): Promise<{ url: string }> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    if (order.status !== RULES[kind].requires) {
      throw new ValidationError("O pedido não está pronto para este pagamento.");
    }

    const studio = await this.deps.studios.findById(order.studioId);
    if (!studio) throw new NotFoundError("Estúdio");
    if (!studio.stripeAccountId) {
      throw new ValidationError("O estúdio ainda não conectou os pagamentos.");
    }

    const amountCents = amountFor(kind, order);
    if (amountCents <= 0) throw new ValidationError("Valor de pagamento inválido.");
    const applicationFeeCents = feeFor(amountCents, this.deps.platformFeePercent);

    // Idempotente: reaproveita um pagamento pendente do mesmo tipo.
    const existing = await this.deps.payments.findPendingForOrder(order.studioId, orderId, kind);
    const session = await this.deps.gateway.createOrderCheckout({
      orderId,
      kind,
      amountCents,
      connectedAccountId: studio.stripeAccountId,
      applicationFeeCents,
      metadata: { orderId, kind, studioId: order.studioId },
    });
    if (!existing) {
      await this.deps.payments.createPending({
        studioId: order.studioId,
        orderId,
        kind,
        amountCents,
        feeCents: applicationFeeCents,
        providerRef: session.providerRef,
      });
    }
    return { url: session.url };
  }
}

/**
 * Confirma o pagamento (simula o webhook do provedor). Idempotente: se o pedido
 * já avançou, apenas retorna. Marca o Payment SUCCEEDED e transita o pedido.
 */
export class ConfirmOrderPaymentUseCase {
  constructor(private readonly deps: PaymentUseCaseDeps) {}

  async execute(actor: Actor | null, orderId: string, kind: PaymentKind): Promise<Order> {
    assertAuthenticated(actor);
    if (!this.deps.allowSelfConfirmation) {
      // Stripe real está configurado: a única fonte confiável de confirmação é
      // o webhook assinado. Aceitar a palavra do próprio cliente aqui seria dar
      // acesso pago de graça.
      throw new ValidationError(
        "Este pagamento é confirmado automaticamente pelo provedor. Aguarde a confirmação.",
      );
    }
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");

    const rule = RULES[kind];
    if (order.status === rule.to) return order; // já confirmado — idempotente
    if (order.status !== rule.requires) {
      throw new ValidationError("Pagamento não aplicável ao estado atual do pedido.");
    }

    const payment = await this.deps.payments.findPendingForOrder(order.studioId, orderId, kind);
    if (payment) await this.deps.payments.markSucceeded(order.studioId, payment.id);

    assertTransition(order.status, rule.to);
    const updated = await this.deps.orders.transition(orderId, order.studioId, {
      from: order.status,
      to: rule.to,
      actorId: actor.userId,
      metadata: { payment: kind },
    });

    const artist = await this.deps.artists.findById(order.artistId);
    if (artist) {
      await this.deps.notifications.create({
        userId: artist.userId,
        type: kind === "DEPOSIT" ? "payment.deposit_paid" : "payment.final_paid",
        payload: { orderId, artistId: artist.id },
      });
    }
    await this.deps.audit.log({
      studioId: order.studioId,
      userId: actor.userId,
      action: kind === "DEPOSIT" ? "payment.deposit_succeeded" : "payment.final_succeeded",
      entity: "Order",
      entityId: orderId,
    });
    return updated;
  }
}

/**
 * Confirma o pagamento a partir de um WEBHOOK do provedor (contexto de sistema,
 * SEM actor). É o caminho de produção: só é chamado após verificar a assinatura
 * do webhook, e os ids vêm do metadata que NÓS setamos no checkout. Idempotente.
 */
export class ConfirmPaymentByReferenceUseCase {
  constructor(private readonly deps: PaymentUseCaseDeps) {}

  async execute(input: { orderId: string; studioId: string; kind: PaymentKind }): Promise<void> {
    const { orderId, studioId, kind } = input;
    const order = await this.deps.orders.findByIdForStudio(orderId, studioId);
    if (!order) throw new NotFoundError("Pedido");

    const rule = RULES[kind];
    if (order.status === rule.to) return; // já confirmado — idempotente (webhook reentrante)
    if (order.status !== rule.requires) return; // fora de sequência — ignora com segurança

    const payment = await this.deps.payments.findPendingForOrder(studioId, orderId, kind);
    if (payment) await this.deps.payments.markSucceeded(studioId, payment.id);

    assertTransition(order.status, rule.to);
    await this.deps.orders.transition(orderId, studioId, {
      from: order.status,
      to: rule.to,
      actorId: "system",
      metadata: { payment: kind, source: "webhook" },
    });

    const artist = await this.deps.artists.findById(order.artistId);
    if (artist) {
      await this.deps.notifications.create({
        userId: artist.userId,
        type: kind === "DEPOSIT" ? "payment.deposit_paid" : "payment.final_paid",
        payload: { orderId, artistId: artist.id },
      });
    }
    await this.deps.audit.log({
      studioId,
      userId: null,
      action: kind === "DEPOSIT" ? "payment.deposit_succeeded" : "payment.final_succeeded",
      entity: "Order",
      entityId: orderId,
      metadata: { source: "stripe_webhook" },
    });
  }
}
