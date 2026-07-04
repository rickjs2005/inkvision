import { type Actor, assertStudioRole } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import type { PaymentUseCaseDeps } from "./deps";

/** Dono conecta a conta de pagamentos do estúdio (Connect onboarding). */
export class ConnectStudioPaymentsUseCase {
  constructor(private readonly deps: Pick<PaymentUseCaseDeps, "studios" | "gateway" | "audit">) {}

  async execute(actor: Actor, studioId: string): Promise<{ accountId: string }> {
    assertStudioRole(actor, studioId, "OWNER");
    const studio = await this.deps.studios.findById(studioId);
    if (!studio) throw new NotFoundError("Estúdio");

    const { accountId } = await this.deps.gateway.connectStudio(studioId);
    await this.deps.studios.setStripeAccount(studioId, accountId);
    await this.deps.audit.log({
      studioId,
      userId: actor.userId,
      action: "studio.payments_connected",
      entity: "Studio",
      entityId: studioId,
    });
    return { accountId };
  }
}
