import { type Actor, assertStudioRole } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import type { AccountStatus } from "../../ports/payment-gateway";
import type { PaymentUseCaseDeps } from "./deps";

export interface OnboardingUrls {
  /** Volta para cá se o link expirar (gera um novo). */
  refreshUrl: string;
  /** Volta para cá ao concluir/sair do onboarding. */
  returnUrl: string;
}

/**
 * Dono inicia (ou retoma) o onboarding da conta de recebimento do estúdio.
 * Idempotente na conta: reusa a existente em vez de criar uma órfã a cada
 * clique; o Account Link é sempre novo (expira rápido por design do provedor).
 */
export class ConnectStudioPaymentsUseCase {
  constructor(private readonly deps: Pick<PaymentUseCaseDeps, "studios" | "gateway" | "audit">) {}

  async execute(
    actor: Actor,
    studioId: string,
    urls: OnboardingUrls,
  ): Promise<{ accountId: string; url: string }> {
    assertStudioRole(actor, studioId, "OWNER");
    const studio = await this.deps.studios.findById(studioId);
    if (!studio) throw new NotFoundError("Estúdio");

    let accountId = studio.stripeAccountId ?? null;
    if (!accountId) {
      ({ accountId } = await this.deps.gateway.connectStudio(studioId));
      await this.deps.studios.setStripeAccount(studioId, accountId);
      await this.deps.audit.log({
        studioId,
        userId: actor.userId,
        action: "studio.payments_connected",
        entity: "Studio",
        entityId: studioId,
      });
    }

    const { url } = await this.deps.gateway.createAccountOnboardingLink({
      accountId,
      refreshUrl: urls.refreshUrl,
      returnUrl: urls.returnUrl,
    });
    return { accountId, url };
  }
}

/**
 * Status da conta de recebimento do estúdio (visão do dono na página de
 * planos). `null` quando ainda não há conta conectada.
 */
export class GetPaymentsAccountStatusUseCase {
  constructor(private readonly deps: Pick<PaymentUseCaseDeps, "studios" | "gateway">) {}

  async execute(
    actor: Actor,
    studioId: string,
  ): Promise<({ accountId: string } & AccountStatus) | null> {
    assertStudioRole(actor, studioId, "OWNER");
    const studio = await this.deps.studios.findById(studioId);
    if (!studio) throw new NotFoundError("Estúdio");
    if (!studio.stripeAccountId) return null;

    const status = await this.deps.gateway.getAccountStatus(studio.stripeAccountId);
    return { accountId: studio.stripeAccountId, ...status };
  }
}
