import { parseInput } from "../../validate";
import { type Actor, assertStudioRole } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import { onboardingSchema, type OnboardingInput } from "../../dtos/studio.dto";
import type { Studio } from "../../ports/studio-repository";
import type { StudioUseCaseDeps } from "./deps";

/**
 * Dono completa o onboarding: preenche dados obrigatórios e o estúdio passa de
 * PENDING para ACTIVE (fica visível publicamente).
 */
export class CompleteOnboardingUseCase {
  constructor(private readonly deps: Pick<StudioUseCaseDeps, "studios" | "audit">) {}

  async execute(actor: Actor, studioId: string, rawInput: OnboardingInput): Promise<Studio> {
    assertStudioRole(actor, studioId, "OWNER");
    const input = parseInput(onboardingSchema, rawInput);

    const existing = await this.deps.studios.findById(studioId);
    if (!existing) throw new NotFoundError("Estúdio");

    await this.deps.studios.update(studioId, input);
    const studio =
      existing.status === "PENDING"
        ? await this.deps.studios.setStatus(studioId, "ACTIVE")
        : await this.deps.studios.findById(studioId);

    await this.deps.audit.log({
      studioId,
      userId: actor.userId,
      action: "studio.onboarded",
      entity: "Studio",
      entityId: studioId,
    });
    return studio!;
  }
}
