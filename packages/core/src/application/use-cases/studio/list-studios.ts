import { parseInput } from "../../validate";
import { type Actor, assertPlatformAdmin } from "../../../domain/actor";
import { listStudiosSchema, type ListStudiosInput } from "../../dtos/studio.dto";
import type { Studio } from "../../ports/studio-repository";
import type { StudioUseCaseDeps } from "./deps";

/** Admin lista estúdios com filtro por status/busca e paginação. */
export class ListStudiosUseCase {
  constructor(private readonly deps: Pick<StudioUseCaseDeps, "studios">) {}

  async execute(
    actor: Actor,
    rawInput: ListStudiosInput,
  ): Promise<{ items: Studio[]; total: number; page: number; perPage: number }> {
    assertPlatformAdmin(actor);
    const { status, query, page, perPage } = parseInput(listStudiosSchema, rawInput);
    const { items, total } = await this.deps.studios.list({
      status,
      query,
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return { items, total, page, perPage };
  }
}
