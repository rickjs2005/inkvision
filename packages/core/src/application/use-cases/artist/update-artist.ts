import { parseInput } from "../../validate";
import type { Actor } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import { updateArtistSchema, type UpdateArtistInput } from "../../dtos/artist.dto";
import type { Artist } from "../../ports/artist-repository";
import { assertCanManageArtist, type ArtistUseCaseDeps } from "./deps";

/** Tatuador (ou gerente do estúdio) edita o perfil. */
export class UpdateArtistUseCase {
  constructor(private readonly deps: Pick<ArtistUseCaseDeps, "artists" | "audit">) {}

  async execute(actor: Actor, artistId: string, rawInput: UpdateArtistInput): Promise<Artist> {
    const artist = await this.deps.artists.findById(artistId);
    if (!artist) throw new NotFoundError("Tatuador");
    assertCanManageArtist(actor, artist);

    const input = parseInput(updateArtistSchema, rawInput);
    const normalized = {
      ...input,
      instagram: input.instagram ? input.instagram.replace(/^@/, "") : input.instagram,
    };
    const updated = await this.deps.artists.update(artistId, normalized);
    await this.deps.audit.log({
      studioId: artist.studioId,
      userId: actor.userId,
      action: "artist.updated",
      entity: "ArtistProfile",
      entityId: artistId,
    });
    return updated;
  }
}
