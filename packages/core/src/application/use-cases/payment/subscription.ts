import { type Actor, assertStudioRole } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
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
    private readonly deps: Pick<PaymentUseCaseDeps, "studios" | "subscriptions" | "audit">,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(actor: Actor, studioId: string, planSlug: string): Promise<void> {
    assertStudioRole(actor, studioId, "OWNER");
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
