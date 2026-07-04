import { parseInput } from "../../validate";
import type { Actor } from "../../../domain/actor";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors";
import { addArtistSchema, type AddArtistInput } from "../../dtos/artist.dto";
import type { Artist } from "../../ports/artist-repository";
import { FREE_TIER_MAX_ARTISTS } from "../../ports/subscription-repository";
import { assertStudioManager, type ArtistUseCaseDeps } from "./deps";

/**
 * Dono/gerente adiciona um tatuador ao estúdio: vincula o usuário (existente)
 * como membro ARTIST e cria o perfil de artista.
 */
export class AddArtistUseCase {
  constructor(private readonly deps: ArtistUseCaseDeps) {}

  async execute(actor: Actor, studioId: string, rawInput: AddArtistInput): Promise<Artist> {
    assertStudioManager(actor, studioId);
    const input = parseInput(addArtistSchema, rawInput);

    const studio = await this.deps.studios.findById(studioId);
    if (!studio) throw new NotFoundError("Estúdio");

    const user = await this.deps.users.findByEmail(input.email);
    if (!user) throw new ValidationError("O tatuador precisa ter uma conta InkVision.");

    const existing = await this.deps.artists.findByUserAndStudio(user.id, studioId);
    if (existing) throw new ConflictError("Este usuário já é tatuador do estúdio.");

    // Gate do plano: respeita o limite de tatuadores da assinatura (ou trial).
    const sub = await this.deps.subscriptions.getActiveForStudio(studioId);
    const maxArtists = sub?.maxArtists ?? FREE_TIER_MAX_ARTISTS;
    const current = await this.deps.artists.listByStudio(studioId);
    if (current.length >= maxArtists) {
      throw new ConflictError(
        `Limite de ${maxArtists} tatuador(es) do plano atingido. Faça upgrade para adicionar mais.`,
      );
    }

    await this.deps.studios.addMember(studioId, user.id, "ARTIST");
    const artist = await this.deps.artists.addArtist(studioId, user.id);

    await this.deps.audit.log({
      studioId,
      userId: actor.userId,
      action: "artist.added",
      entity: "ArtistProfile",
      entityId: artist.id,
      metadata: { userId: user.id },
    });
    return artist;
  }
}
