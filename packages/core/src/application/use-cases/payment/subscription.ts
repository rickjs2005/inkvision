import { type Actor, assertStudioRole } from "../../../domain/actor";
import { NotFoundError, ValidationError } from "../../../domain/errors";
import type { PaymentUseCaseDeps } from "./deps";

/** Dono assina um plano — inicia o checkout de Billing (mock). */
export class SubscribeStudioUseCase {
  constructor(private readonly deps: Pick<PaymentUseCaseDeps, "studios" | "subscriptions" | "gateway">) {}

  async execute(actor: Actor, studioId: string, planSlug: string): Promise<{ url: string }> {
    assertStudioRole(actor, studioId, "OWNER");
    const plan = await this.deps.subscriptions.getPlanBySlug(planSlug);
    if (!plan) throw new NotFoundError("Plano");
    const session = await this.deps.gateway.createSubscriptionCheckout({ studioId, planSlug });
    return { url: session.url };
  }
}

/** Confirma a assinatura (simula webhook) — ativa o plano por 30 dias. */
export class ConfirmSubscriptionUseCase {
  constructor(
    private readonly deps: Pick<PaymentUseCaseDeps, "studios" | "subscriptions" | "audit" | "allowSelfConfirmation">,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: Actor, studioId: string, planSlug: string): Promise<void> {
    assertStudioRole(actor, studioId, "OWNER");
    if (!this.deps.allowSelfConfirmation) {
      // Mesmo raciocínio do pagamento de pedido: com Stripe real, só o webhook
      // assinado (ConfirmSubscriptionByReferenceUseCase) pode ativar o plano.
      throw new ValidationError(
        "Esta assinatura é confirmada automaticamente pelo provedor. Aguarde a confirmação.",
      );
    }
    const plan = await this.deps.subscriptions.getPlanBySlug(planSlug);
    if (!plan) throw new NotFoundError("Plano");

    const periodEnd = new Date(this.now().getTime() + 30 * 24 * 60 * 60 * 1000);
    await this.deps.subscriptions.upsertActive({
      studioId,
      planId: plan.id,
      providerRef: `sub_mock_${studioId}_${plan.slug}`,
      currentPeriodEnd: periodEnd,
    });
    await this.deps.audit.log({
      studioId,
      userId: actor.userId,
      action: "subscription.activated",
      entity: "Subscription",
      entityId: studioId,
      metadata: { plan: plan.slug },
    });
  }
}

/**
 * Confirma a assinatura a partir de um WEBHOOK do provedor (contexto de
 * sistema, sem actor) — só chamado após verificar a assinatura do evento.
 * Idempotente via upsertActive (mesma chave de estúdio).
 */
export class ConfirmSubscriptionByReferenceUseCase {
  constructor(
    private readonly deps: Pick<PaymentUseCaseDeps, "studios" | "subscriptions" | "audit">,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: { studioId: string; planSlug: string }): Promise<void> {
    const { studioId, planSlug } = input;
    const studio = await this.deps.studios.findById(studioId);
    if (!studio) return; // referência desconhecida — ignora com segurança (webhook reentrante/forjado)
    const plan = await this.deps.subscriptions.getPlanBySlug(planSlug);
    if (!plan) return;

    const periodEnd = new Date(this.now().getTime() + 30 * 24 * 60 * 60 * 1000);
    await this.deps.subscriptions.upsertActive({
      studioId,
      planId: plan.id,
      providerRef: `sub_${studioId}_${plan.slug}`,
      currentPeriodEnd: periodEnd,
    });
    await this.deps.audit.log({
      studioId,
      userId: null,
      action: "subscription.activated",
      entity: "Subscription",
      entityId: studioId,
      metadata: { plan: plan.slug, source: "stripe_webhook" },
    });
  }
}
