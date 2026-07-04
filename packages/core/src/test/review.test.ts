import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "../domain/actor";
import type { CreateReviewData, Review, ReviewRepository } from "../application/ports/review-repository";
import { ReviewOrderUseCase } from "../application/use-cases/review/review";
import { InMemoryArtistRepo } from "./fakes-artist";
import { InMemoryNotificationRepo, InMemoryOrderRepo } from "./fakes-order";

class InMemoryReviewRepo implements ReviewRepository {
  reviews: Review[] = [];
  recomputed = 0;
  async create(d: CreateReviewData): Promise<Review> {
    const r: Review = { id: `r_${this.reviews.length + 1}`, createdAt: new Date(0), ...d };
    this.reviews.push(r);
    return r;
  }
  async getForOrder(_s: string, orderId: string) {
    return this.reviews.find((r) => r.orderId === orderId) ?? null;
  }
  async listForArtist(artistId: string) {
    return this.reviews.filter((r) => r.artistId === artistId);
  }
  async recomputeArtistRating() {
    this.recomputed++;
    return { avg: 5, count: this.reviews.length };
  }
}

const STUDIO = "studio_1";
const client: Actor = { userId: "u_client", platformRole: "USER", memberships: [] };

describe("ReviewOrder", () => {
  let orders: InMemoryOrderRepo;
  let reviews: InMemoryReviewRepo;
  let artists: InMemoryArtistRepo;
  let notifications: InMemoryNotificationRepo;
  let orderId: string;

  beforeEach(async () => {
    orders = new InMemoryOrderRepo();
    reviews = new InMemoryReviewRepo();
    artists = new InMemoryArtistRepo();
    notifications = new InMemoryNotificationRepo();
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const order = await orders.create({ studioId: STUDIO, clientId: "u_client", artistId: artist.id, bodyPart: "braço", briefing: "x".repeat(12), references: [] });
    order.status = "COMPLETED";
    orderId = order.id;
  });

  const deps = () => ({ reviews, orders, artists, notifications });

  it("avalia → REVIEWED, recalcula a nota e notifica", async () => {
    await new ReviewOrderUseCase(deps()).execute(client, orderId, { rating: 5, comment: "Top!" });
    expect(orders.orders[0]!.status).toBe("REVIEWED");
    expect(reviews.recomputed).toBe(1);
    expect(await notifications.countUnread("u_artist")).toBe(1);
  });

  it("não avalia antes de concluir", async () => {
    orders.orders[0]!.status = "SCHEDULED";
    await expect(
      new ReviewOrderUseCase(deps()).execute(client, orderId, { rating: 5 }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("não avalia duas vezes", async () => {
    await new ReviewOrderUseCase(deps()).execute(client, orderId, { rating: 4 });
    orders.orders[0]!.status = "COMPLETED"; // força para testar o guard de duplicidade
    await expect(
      new ReviewOrderUseCase(deps()).execute(client, orderId, { rating: 3 }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});
