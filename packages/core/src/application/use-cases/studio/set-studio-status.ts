import { type Actor, assertPlatformAdmin } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import type { Studio, StudioStatus } from "../../ports/studio-repository";
import type { StudioUseCaseDeps } from "./deps";

/** Admin suspende/reativa um estúdio. Suspenso bloqueia acesso do tenant. */
export class SetStudioStatusUseCase {
  constructor(private readonly deps: Pick<StudioUseCaseDeps, "studios" | "audit">) {}

  async execute(actor: Actor, studioId: string, status: StudioStatus): Promise<Studio> {
    assertPlatformAdmin(actor);
    const existing = await this.deps.studios.findById(studioId);
    if (!existing) throw new NotFoundError("Estúdio");

    const studio = await this.deps.studios.setStatus(studioId, status);
    await this.deps.audit.log({
      studioId,
      userId: actor.userId,
      action: status === "SUSPENDED" ? "studio.suspended" : "studio.status_changed",
      entity: "Studio",
      entityId: studioId,
      metadata: { from: existing.status, to: status },
    });
    return studio;
  }
}
