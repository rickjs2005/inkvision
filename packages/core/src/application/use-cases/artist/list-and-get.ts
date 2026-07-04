import { type Actor, isPlatformAdmin, membershipIn } from "../../../domain/actor";
import { ForbiddenError, NotFoundError } from "../../../domain/errors";
import type { Artist, ListPublicArtistsParams } from "../../ports/artist-repository";
import type { ArtistUseCaseDeps } from "./deps";

/** Lista os tatuadores de um estúdio (para membros do estúdio/admin). */
export class ListStudioArtistsUseCase {
  constructor(private readonly deps: Pick<ArtistUseCaseDeps, "artists">) {}

  async execute(actor: Actor, studioId: string): Promise<Artist[]> {
    if (!isPlatformAdmin(actor) && !membershipIn(actor, studioId)) throw new ForbiddenError();
    return this.deps.artists.listByStudio(studioId);
  }
}

/** Perfil público do tatuador. Inativo só aparece para admin/membros. */
export class GetArtistUseCase {
  constructor(
    private readonly deps: Pick<ArtistUseCaseDeps, "artists" | "studios">,
  ) {}

  async execute(artistId: string, actor: Actor | null): Promise<Artist> {
    const artist = await this.deps.artists.findById(artistId);
    if (!artist) throw new NotFoundError("Tatuador");

    if (!artist.isActive) {
      const privileged =
        actor && (isPlatformAdmin(actor) || membershipIn(actor, artist.studioId) !== null);
      if (!privileged) throw new NotFoundError("Tatuador");
    }
    return artist;
  }
}

/** Descoberta pública de tatuadores (filtro por estilo/busca). */
export class ListPublicArtistsUseCase {
  constructor(private readonly deps: Pick<ArtistUseCaseDeps, "artists">) {}

  async execute(params: ListPublicArtistsParams) {
    return this.deps.artists.listPublic(params);
  }
}
