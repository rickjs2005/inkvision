import { prisma, withStudio } from "@inkvision/db";
import type { CreateReviewData, Review, ReviewRepository } from "@inkvision/core";

function toDomain(r: {
  id: string;
  orderId: string;
  studioId: string;
  artistId: string;
  clientId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}): Review {
  return r;
}

/** Review é público-legível (RLS public_read), tenant-gravável. */
export class PrismaReviewRepository implements ReviewRepository {
  async create(data: CreateReviewData): Promise<Review> {
    const r = await withStudio(data.studioId, (tx) =>
      tx.review.create({
        data: {
          orderId: data.orderId,
          studioId: data.studioId,
          artistId: data.artistId,
          clientId: data.clientId,
          rating: data.rating,
          comment: data.comment,
        },
      }),
    );
    return toDomain(r);
  }

  async getForOrder(_studioId: string, orderId: string): Promise<Review | null> {
    const r = await prisma.review.findUnique({ where: { orderId } });
    return r ? toDomain(r) : null;
  }

  async listForArtist(artistId: string, take = 20): Promise<Review[]> {
    const rows = await prisma.review.findMany({
      where: { artistId },
      orderBy: { createdAt: "desc" },
      take,
    });
    return rows.map(toDomain);
  }

  async recomputeArtistRating(studioId: string, artistId: string): Promise<{ avg: number; count: number }> {
    const agg = await prisma.review.aggregate({
      where: { artistId },
      _avg: { rating: true },
      _count: true,
    });
    const avg = agg._avg.rating ?? 0;
    const count = agg._count;
    await withStudio(studioId, (tx) =>
      tx.artistProfile.update({
        where: { id: artistId },
        data: { ratingAvg: avg, ratingCount: count },
      }),
    );
    return { avg, count };
  }
}
