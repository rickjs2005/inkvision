import { parseInput } from "../../validate";
import type { Actor } from "../../../domain/actor";
import { NotFoundError, ValidationError } from "../../../domain/errors";
import { setStylesSchema, type SetStylesInput } from "../../dtos/artist.dto";
import type { Artist } from "../../ports/artist-repository";
import { assertCanManageArtist, type ArtistUseCaseDeps } from "./deps";

/** Define os estilos do tatuador (valida que os ids existem). */
export class SetArtistStylesUseCase {
  constructor(private readonly deps: Pick<ArtistUseCaseDeps, "artists" | "styles">) {}

  async execute(actor: Actor, artistId: string, rawInput: SetStylesInput): Promise<Artist> {
    const artist = await this.deps.artists.findById(artistId);
    if (!artist) throw new NotFoundError("Tatuador");
    assertCanManageArtist(actor, artist);

    const { styleIds } = parseInput(setStylesSchema, rawInput);
    const unique = [...new Set(styleIds)];
    if (unique.length > 0) {
      const found = await this.deps.styles.countByIds(unique);
      if (found !== unique.length) throw new ValidationError("Um ou mais estilos são inválidos.");
    }
    return this.deps.artists.setStyles(artistId, unique);
  }
}
