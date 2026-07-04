export interface ArtistStyleRef {
  id: string;
  slug: string;
  name: string;
}

export interface Artist {
  id: string;
  studioId: string;
  userId: string;
  name: string; // do User
  bio?: string | null;
  experienceYears?: number | null;
  instagram?: string | null;
  avgPriceCents?: number | null;
  avgResponseMin?: number | null;
  ratingAvg?: number | null;
  ratingCount: number;
  isActive: boolean;
  styles: ArtistStyleRef[];
}

export interface UpdateArtistData {
  bio?: string | null;
  experienceYears?: number | null;
  instagram?: string | null;
  avgPriceCents?: number | null;
  isActive?: boolean;
}

export interface ListPublicArtistsParams {
  styleSlug?: string;
  query?: string;
  skip?: number;
  take?: number;
}

export interface ArtistRepository {
  addArtist(studioId: string, userId: string): Promise<Artist>;
  findById(id: string): Promise<Artist | null>;
  findByUserAndStudio(userId: string, studioId: string): Promise<Artist | null>;
  update(id: string, data: UpdateArtistData): Promise<Artist>;
  setStyles(id: string, styleIds: string[]): Promise<Artist>;
  listByStudio(studioId: string, opts?: { activeOnly?: boolean }): Promise<Artist[]>;
  listPublic(params: ListPublicArtistsParams): Promise<{ items: Artist[]; total: number }>;
}
