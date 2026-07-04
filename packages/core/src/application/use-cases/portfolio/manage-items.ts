import { parseInput } from "../../validate";
import type { Actor } from "../../../domain/actor";
import { NotFoundError, ValidationError } from "../../../domain/errors";
import { assertCanManageArtist } from "../artist/deps";
import {
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  type CreatePortfolioItemInput,
  type UpdatePortfolioItemInput,
} from "../../dtos/portfolio.dto";
import type { PortfolioItem } from "../../ports/portfolio-repository";
import type { PortfolioUseCaseDeps } from "./deps";

async function validateStyle(
  styles: PortfolioUseCaseDeps["styles"],
  styleId?: string | null,
): Promise<void> {
  if (!styleId) return;
  if ((await styles.countByIds([styleId])) !== 1) throw new ValidationError("Estilo inválido.");
}

/** Tatuador (ou gerente) cria um item de portfólio. studioId vem do artista. */
export class CreatePortfolioItemUseCase {
  constructor(private readonly deps: PortfolioUseCaseDeps) {}

  async execute(
    actor: Actor,
    artistId: string,
    rawInput: CreatePortfolioItemInput,
  ): Promise<PortfolioItem> {
    const artist = await this.deps.artists.findById(artistId);
    if (!artist) throw new NotFoundError("Tatuador");
    assertCanManageArtist(actor, artist);

    const input = parseInput(createPortfolioItemSchema, rawInput);
    await validateStyle(this.deps.styles, input.styleId);

    const item = await this.deps.portfolio.create({
      studioId: artist.studioId, // derivado — nunca confia em input do cliente
      artistId,
      type: input.type,
      mediaUrl: input.type === "BEFORE_AFTER" ? input.afterUrl! : input.mediaUrl!,
      beforeUrl: input.beforeUrl ?? null,
      afterUrl: input.afterUrl ?? null,
      description: input.description ?? null,
      tags: input.tags,
      styleId: input.styleId ?? null,
    });
    await this.deps.audit.log({
      studioId: artist.studioId,
      userId: actor.userId,
      action: "portfolio.created",
      entity: "PortfolioItem",
      entityId: item.id,
    });
    return item;
  }
}

export class UpdatePortfolioItemUseCase {
  constructor(private readonly deps: PortfolioUseCaseDeps) {}

  async execute(
    actor: Actor,
    itemId: string,
    rawInput: UpdatePortfolioItemInput,
  ): Promise<PortfolioItem> {
    const item = await this.deps.portfolio.findById(itemId);
    if (!item) throw new NotFoundError("Item");
    const artist = await this.deps.artists.findById(item.artistId);
    if (!artist) throw new NotFoundError("Tatuador");
    assertCanManageArtist(actor, artist);

    const input = parseInput(updatePortfolioItemSchema, rawInput);
    await validateStyle(this.deps.styles, input.styleId);
    return this.deps.portfolio.update(itemId, input);
  }
}

export class DeletePortfolioItemUseCase {
  constructor(private readonly deps: PortfolioUseCaseDeps) {}

  async execute(actor: Actor, itemId: string): Promise<void> {
    const item = await this.deps.portfolio.findById(itemId);
    if (!item) throw new NotFoundError("Item");
    const artist = await this.deps.artists.findById(item.artistId);
    if (!artist) throw new NotFoundError("Tatuador");
    assertCanManageArtist(actor, artist);

    await this.deps.portfolio.delete(itemId);
    await this.deps.audit.log({
      studioId: item.studioId,
      userId: actor.userId,
      action: "portfolio.deleted",
      entity: "PortfolioItem",
      entityId: itemId,
    });
  }
}
