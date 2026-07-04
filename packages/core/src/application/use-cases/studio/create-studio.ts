import { parseInput } from "../../validate";
import { type Actor, assertPlatformAdmin } from "../../../domain/actor";
import { ConflictError, ValidationError } from "../../../domain/errors";
import { isReservedSlug, slugify } from "../../../domain/slug";
import { createStudioSchema, type CreateStudioInput } from "../../dtos/studio.dto";
import type { Studio } from "../../ports/studio-repository";
import type { StudioUseCaseDeps } from "./deps";

/**
 * Admin da plataforma cria um estúdio (status PENDING) e vincula o dono
 * (usuário existente) como OWNER. O dono completa o onboarding depois.
 */
export class CreateStudioUseCase {
  constructor(private readonly deps: StudioUseCaseDeps) {}

  async execute(actor: Actor, rawInput: CreateStudioInput): Promise<Studio> {
    assertPlatformAdmin(actor);
    const input = parseInput(createStudioSchema, rawInput);

    const owner = await this.deps.users.findByEmail(input.ownerEmail);
    if (!owner) {
      throw new ValidationError(
        "O dono precisa ter uma conta InkVision antes de receber um estúdio.",
      );
    }

    const slug = await this.resolveSlug(input.slug ?? slugify(input.name));

    const studio = await this.deps.studios.create({
      slug,
      name: input.name,
      description: input.description ?? null,
    });

    await this.deps.studios.addMember(studio.id, owner.id, "OWNER");
    await this.deps.audit.log({
      studioId: studio.id,
      userId: actor.userId,
      action: "studio.created",
      entity: "Studio",
      entityId: studio.id,
      metadata: { slug, ownerId: owner.id },
    });

    return studio;
  }

  /** Garante slug válido e único. Slug explícito em conflito falha; derivado recebe sufixo. */
  private async resolveSlug(base: string): Promise<string> {
    const seed = slugify(base);
    if (!seed || seed.length < 3) throw new ValidationError("Nome gera um slug inválido.");
    if (isReservedSlug(seed)) throw new ConflictError(`O slug "${seed}" é reservado.`);

    if (!(await this.deps.studios.slugExists(seed))) return seed;

    for (let i = 2; i <= 99; i++) {
      const candidate = `${seed}-${i}`.slice(0, 48);
      if (!(await this.deps.studios.slugExists(candidate))) return candidate;
    }
    throw new ConflictError("Não foi possível gerar um slug único.");
  }
}
