import { type Actor, isPlatformAdmin, membershipIn } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import type { Studio } from "../../ports/studio-repository";
import type { StudioUseCaseDeps } from "./deps";

/**
 * Busca pública por slug. Estúdios não-ACTIVE só aparecem para o admin da
 * plataforma ou membros do próprio estúdio (evita expor rascunhos/suspensos).
 */
export class GetStudioBySlugUseCase {
  constructor(private readonly deps: Pick<StudioUseCaseDeps, "studios">) {}

  async execute(slug: string, actor: Actor | null): Promise<Studio> {
    const studio = await this.deps.studios.findBySlug(slug);
    if (!studio) throw new NotFoundError("Estúdio");

    if (studio.status !== "ACTIVE") {
      const privileged =
        actor && (isPlatformAdmin(actor) || membershipIn(actor, studio.id) !== null);
      if (!privileged) throw new NotFoundError("Estúdio");
    }
    return studio;
  }
}
