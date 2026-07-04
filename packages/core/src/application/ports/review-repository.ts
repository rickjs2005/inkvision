export interface Review {
  id: string;
  orderId: string;
  studioId: string;
  artistId: string;
  clientId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}

export interface CreateReviewData {
  orderId: string;
  studioId: string;
  artistId: string;
  clientId: string;
  rating: number;
  comment: string | null;
}

export interface ReviewRepository {
  create(data: CreateReviewData): Promise<Review>;
  getForOrder(studioId: string, orderId: string): Promise<Review | null>;
  listForArtist(artistId: string, take?: number): Promise<Review[]>;
  /** Recalcula e persiste ratingAvg/ratingCount do tatuador. */
  recomputeArtistRating(studioId: string, artistId: string): Promise<{ avg: number; count: number }>;
}
