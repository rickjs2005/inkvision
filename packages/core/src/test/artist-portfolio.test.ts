import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "../domain/actor";
import { AddArtistUseCase } from "../application/use-cases/artist/add-artist";
import { SetArtistStylesUseCase } from "../application/use-cases/artist/set-artist-styles";
import { CreatePortfolioItemUseCase } from "../application/use-cases/portfolio/manage-items";
import { ToggleLikeUseCase } from "../application/use-cases/portfolio/engagement";
import { InMemoryAudit, InMemoryStudioRepo, InMemoryUserRepo } from "./fakes";
import { InMemoryNotificationRepo } from "./fakes-order";
import {
  InMemoryArtistRepo,
  InMemoryPortfolioRepo,
  InMemoryStyleRepo,
  InMemorySubscriptionRepo,
} from "./fakes-artist";

const STUDIO = "studio_1";
const owner: Actor = { userId: "u_owner", platformRole: "USER", memberships: [{ studioId: STUDIO, role: "OWNER" }] };
const artistActor: Actor = { userId: "u_artist", platformRole: "USER", memberships: [{ studioId: STUDIO, role: "ARTIST" }] };
const stranger: Actor = { userId: "u_x", platformRole: "USER", memberships: [] };

describe("Artistas + Portfólio", () => {
  let artists: InMemoryArtistRepo;
  let portfolio: InMemoryPortfolioRepo;
  let styles: InMemoryStyleRepo;
  let studios: InMemoryStudioRepo;
  let audit: InMemoryAudit;

  beforeEach(() => {
    artists = new InMemoryArtistRepo();
    portfolio = new InMemoryPortfolioRepo();
    styles = new InMemoryStyleRepo(["fine-line", "blackwork"]);
    studios = new InMemoryStudioRepo();
    audit = new InMemoryAudit();
  });

  it("dono adiciona tatuador (usuário existente) e cria membership+perfil", async () => {
    await studios.create({ slug: "alma", name: "Alma" });
    studios.studios[0]!.id = STUDIO; // fixa o id para o teste
    const users = new InMemoryUserRepo([{ id: "u_new", name: "Novo", email: "novo@t.com" }]);
    const notifications = new InMemoryNotificationRepo();
    const uc = new AddArtistUseCase({ artists, styles, users, studios, audit, subscriptions: new InMemorySubscriptionRepo(), notifications });

    const artist = await uc.execute(owner, STUDIO, { email: "novo@t.com" });
    expect(artist.userId).toBe("u_new");
    expect(artists.memberships).toContainEqual({ studioId: STUDIO, userId: "u_new", role: "ARTIST" });
    // O tatuador vinculado é avisado — sem isso ele só descobria por acaso.
    expect(notifications.items).toContainEqual(
      expect.objectContaining({ userId: "u_new", type: "artist.added_to_studio" }),
    );
  });

  it("rejeita usuário que já é tatuador em outro estúdio, sem criar StudioMember órfão", async () => {
    await studios.create({ slug: "alma", name: "Alma" });
    studios.studios[0]!.id = STUDIO;
    const OUTRO_STUDIO = "studio_outro";
    const users = new InMemoryUserRepo([{ id: "u_ja_tatuador", name: "Já Tatuador", email: "ja@t.com" }]);
    // Usuário já tem ArtistProfile em outro estúdio (ArtistProfile.userId é @unique globalmente).
    artists.seed({ userId: "u_ja_tatuador", studioId: OUTRO_STUDIO });

    const uc = new AddArtistUseCase({ artists, styles, users, studios, audit, subscriptions: new InMemorySubscriptionRepo(), notifications: new InMemoryNotificationRepo() });

    await expect(uc.execute(owner, STUDIO, { email: "ja@t.com" })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    // Nenhum StudioMember novo (para o estúdio que tentou adicionar) foi criado.
    expect(artists.memberships.find((m) => m.studioId === STUDIO)).toBeUndefined();
    // E o ArtistProfile continua único — nenhum novo perfil foi criado para este estúdio.
    expect(artists.artists.filter((a) => a.studioId === STUDIO)).toHaveLength(0);
  });

  it("estranho não pode adicionar tatuador", async () => {
    await studios.create({ slug: "alma", name: "Alma" });
    studios.studios[0]!.id = STUDIO;
    const users = new InMemoryUserRepo([{ id: "u_new", name: "Novo", email: "novo@t.com" }]);
    const uc = new AddArtistUseCase({ artists, styles, users, studios, audit, subscriptions: new InMemorySubscriptionRepo(), notifications: new InMemoryNotificationRepo() });
    await expect(uc.execute(stranger, STUDIO, { email: "novo@t.com" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejeita estilos inexistentes", async () => {
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const uc = new SetArtistStylesUseCase({ artists, styles });
    await expect(
      uc.execute(artistActor, artist.id, { styleIds: ["fine-line", "inexistente"] }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("tatuador cria item de portfólio no próprio perfil; studioId é derivado", async () => {
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const uc = new CreatePortfolioItemUseCase({ portfolio, artists, styles, audit });
    const item = await uc.execute(artistActor, artist.id, {
      type: "IMAGE",
      mediaUrl: "https://cdn/x.jpg",
      tags: ["braço"],
    });
    expect(item.studioId).toBe(STUDIO);
    expect(portfolio.items).toHaveLength(1);
  });

  it("estranho não cria item no portfólio de outro", async () => {
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const uc = new CreatePortfolioItemUseCase({ portfolio, artists, styles, audit });
    await expect(
      uc.execute(stranger, artist.id, { type: "IMAGE", mediaUrl: "https://cdn/x.jpg", tags: [] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("like exige autenticação e alterna corretamente", async () => {
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const item = await portfolio.create({ studioId: STUDIO, artistId: artist.id, type: "IMAGE", mediaUrl: "x", tags: [] });
    const uc = new ToggleLikeUseCase({ portfolio });

    await expect(uc.execute(null, item.id)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    const r1 = await uc.execute(stranger, item.id);
    expect(r1).toEqual({ liked: true, likesCount: 1 });
    const r2 = await uc.execute(stranger, item.id);
    expect(r2).toEqual({ liked: false, likesCount: 0 });
  });
});
