import { parseInput } from "../../validate";
import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors";
import { createReviewSchema, type CreateReviewInput } from "../../dtos/review.dto";
import type { ArtistRepository } from "../../ports/artist-repository";
import type { OrderRepository } from "../../ports/order-repository";
import type { ReviewRepository, Review } from "../../ports/review-repository";
import type { NotificationRepository } from "../../ports/notification-repository";

export interface ReviewUseCaseDeps {
  reviews: ReviewRepository;
  orders: OrderRepository;
  artists: Pick<ArtistRepository, "findById">;
  notifications: NotificationRepository;
}

/** Cliente avalia o atendimento após a conclusão → REVIEWED + recalcula a nota. */
export class ReviewOrderUseCase {
  constructor(private readonly deps: ReviewUseCaseDeps) {}
  async execute(actor: Actor | null, orderId: string, rawInput: CreateReviewInput): Promise<Review> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    if (order.status !== "COMPLETED") {
      throw new ValidationError("Só é possível avaliar após a conclusão da sessão.");
    }
    const existing = await this.deps.reviews.getForOrder(order.studioId, orderId);
    if (existing) throw new ConflictError("Este pedido já foi avaliado.");

    const input = parseInput(createReviewSchema, rawInput);
    const review = await this.deps.reviews.create({
      orderId,
      studioId: order.studioId,
      artistId: order.artistId,
      clientId: actor.userId,
      rating: input.rating,
      comment: input.comment ?? null,
    });

    await this.deps.orders.transition(orderId, order.studioId, {
      from: "COMPLETED",
      to: "REVIEWED",
      actorId: actor.userId,
      metadata: { rating: input.rating },
    });
    await this.deps.reviews.recomputeArtistRating(order.studioId, order.artistId);

    const artist = await this.deps.artists.findById(order.artistId);
    if (artist) {
      await this.deps.notifications.create({
        userId: artist.userId,
        type: "order.reviewed",
        payload: { orderId, rating: input.rating },
      });
    }
    return review;
  }
}

/** Lista avaliações públicas de um tatuador. */
export class ListArtistReviewsUseCase {
  constructor(private readonly deps: Pick<ReviewUseCaseDeps, "reviews">) {}
  execute(artistId: string, take = 20): Promise<Review[]> {
    return this.deps.reviews.listForArtist(artistId, take);
  }
}
