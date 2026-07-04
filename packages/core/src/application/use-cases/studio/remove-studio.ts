import { type Actor, assertPlatformAdmin } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import type { StudioUseCaseDeps } from "./deps";

/** Admin remove um estúdio (cascade nas entidades filhas via FK). */
export class RemoveStudioUseCase {
  constructor(private readonly deps: Pick<StudioUseCaseDeps, "studios" | "audit">) {}

  async execute(actor: Actor, studioId: string): Promise<void> {
    assertPlatformAdmin(actor);
    const existing = await this.deps.studios.findById(studioId);
    if (!existing) throw new NotFoundError("Estúdio");

    await this.deps.studios.delete(studioId);
    await this.deps.audit.log({
      studioId: null,
      userId: actor.userId,
      action: "studio.removed",
      entity: "Studio",
      entityId: studioId,
      metadata: { slug: existing.slug },
    });
  }
}
