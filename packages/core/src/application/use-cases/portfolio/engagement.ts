import { parseInput } from "../../validate";
import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { NotFoundError } from "../../../domain/errors";
import { addCommentSchema, type AddCommentInput } from "../../dtos/portfolio.dto";
import type { PortfolioComment } from "../../ports/portfolio-repository";
import type { PortfolioUseCaseDeps } from "./deps";

/** Qualquer usuário autenticado curte/descurte um item. */
export class ToggleLikeUseCase {
  constructor(private readonly deps: Pick<PortfolioUseCaseDeps, "portfolio">) {}

  async execute(actor: Actor | null, itemId: string) {
    assertAuthenticated(actor);
    const item = await this.deps.portfolio.findById(itemId);
    if (!item) throw new NotFoundError("Item");
    return this.deps.portfolio.toggleLike(itemId, actor.userId);
  }
}

export class AddCommentUseCase {
  constructor(private readonly deps: Pick<PortfolioUseCaseDeps, "portfolio">) {}

  async execute(actor: Actor | null, itemId: string, rawInput: AddCommentInput): Promise<PortfolioComment> {
    assertAuthenticated(actor);
    const { body } = parseInput(addCommentSchema, rawInput);
    const item = await this.deps.portfolio.findById(itemId);
    if (!item) throw new NotFoundError("Item");
    return this.deps.portfolio.addComment(itemId, actor.userId, body);
  }
}

export class ListPortfolioUseCase {
  constructor(private readonly deps: Pick<PortfolioUseCaseDeps, "portfolio">) {}

  execute(artistId: string, viewerUserId?: string) {
    return this.deps.portfolio.listByArtist(artistId, viewerUserId);
  }
}

export class ListCommentsUseCase {
  constructor(private readonly deps: Pick<PortfolioUseCaseDeps, "portfolio">) {}

  execute(itemId: string) {
    return this.deps.portfolio.listComments(itemId);
  }
}
