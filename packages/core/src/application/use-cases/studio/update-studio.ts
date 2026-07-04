import { parseInput } from "../../validate";
import { type Actor, assertStudioRole } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import { updateStudioSchema, type UpdateStudioInput } from "../../dtos/studio.dto";
import type { Studio } from "../../ports/studio-repository";
import type { StudioUseCaseDeps } from "./deps";

/** Dono ou gerente edita o perfil do estúdio. */
export class UpdateStudioUseCase {
  constructor(private readonly deps: Pick<StudioUseCaseDeps, "studios" | "audit">) {}

  async execute(actor: Actor, studioId: string, rawInput: UpdateStudioInput): Promise<Studio> {
    assertStudioRole(actor, studioId, "MANAGER");
    const input = parseInput(updateStudioSchema, rawInput);

    const existing = await this.deps.studios.findById(studioId);
    if (!existing) throw new NotFoundError("Estúdio");

    const studio = await this.deps.studios.update(studioId, input);
    await this.deps.audit.log({
      studioId,
      userId: actor.userId,
      action: "studio.updated",
      entity: "Studio",
      entityId: studioId,
      metadata: { fields: Object.keys(input) },
    });
    return studio;
  }
}
