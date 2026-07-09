import { describe, expect, it, beforeEach } from "vitest";
import type { Actor } from "../domain/actor";
import { DomainError } from "../domain/errors";
import { CreateStudioUseCase } from "../application/use-cases/studio/create-studio";
import { InMemoryAudit, InMemoryStudioRepo, InMemoryUserRepo } from "./fakes";

const admin: Actor = { userId: "u_admin", platformRole: "ADMIN", memberships: [] };
const regular: Actor = { userId: "u_reg", platformRole: "USER", memberships: [] };

describe("CreateStudioUseCase", () => {
  let studios: InMemoryStudioRepo;
  let audit: InMemoryAudit;
  let useCase: CreateStudioUseCase;

  beforeEach(() => {
    studios = new InMemoryStudioRepo();
    audit = new InMemoryAudit();
    const users = new InMemoryUserRepo([
      { id: "u_owner", name: "Dona", email: "dona@estudio.com" },
    ]);
    useCase = new CreateStudioUseCase({ studios, users, audit });
  });

  it("bloqueia quem não é admin da plataforma", async () => {
    await expect(
      useCase.execute(regular, { name: "Estúdio Alma", ownerEmail: "dona@estudio.com" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cria estúdio PENDING, vincula o dono como OWNER e audita", async () => {
    const { studio, ownerHasPendingStudio } = await useCase.execute(admin, {
      name: "Estúdio Alma",
      ownerEmail: "dona@estudio.com",
    });

    expect(studio.slug).toBe("estudio-alma");
    expect(studio.status).toBe("PENDING");
    expect(ownerHasPendingStudio).toBe(false);
    expect(studios.members).toEqual([
      { studioId: studio.id, userId: "u_owner", role: "OWNER" },
    ]);
    expect(audit.entries[0]).toMatchObject({ action: "studio.created", entityId: studio.id });
  });

  it("gera slug único com sufixo quando já existe", async () => {
    await useCase.execute(admin, { name: "Alma", ownerEmail: "dona@estudio.com" });
    const { studio: second } = await useCase.execute(admin, { name: "Alma", ownerEmail: "dona@estudio.com" });
    expect(second.slug).toBe("alma-2");
  });

  it("sinaliza aviso (não bloqueia) quando o dono já tem estúdio PENDING", async () => {
    const first = await useCase.execute(admin, { name: "Alma", ownerEmail: "dona@estudio.com" });
    expect(first.ownerHasPendingStudio).toBe(false);

    // Primeiro estúdio continua PENDING (onboarding não concluído) — a segunda
    // criação para o mesmo dono deve ser permitida, mas sinalizada.
    const second = await useCase.execute(admin, { name: "Beta", ownerEmail: "dona@estudio.com" });
    expect(second.ownerHasPendingStudio).toBe(true);
    expect(second.studio.slug).toBe("beta");
  });

  it("rejeita slug reservado", async () => {
    await expect(
      useCase.execute(admin, { name: "Admin", slug: "admin", ownerEmail: "dona@estudio.com" }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("exige que o dono tenha conta", async () => {
    await expect(
      useCase.execute(admin, { name: "Sem Dono", ownerEmail: "fantasma@x.com" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});
