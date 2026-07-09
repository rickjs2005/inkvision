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
  /** Filtra pela cidade do estúdio do tatuador (contains, case-insensitive). */
  city?: string;
  /** Filtra pelo nome do estúdio do tatuador (contains, case-insensitive). */
  studioName?: string;
  skip?: number;
  take?: number;
}

export interface ArtistRepository {
  addArtist(studioId: string, userId: string): Promise<Artist>;
  /**
   * Cria o vínculo (StudioMember ARTIST) e o ArtistProfile numa única
   * transação — evita StudioMember órfão se o ArtistProfile falhar (ex.:
   * usuário já é tatuador em outro estúdio, onde `userId` é @unique global).
   */
  addArtistWithMembership(studioId: string, userId: string): Promise<Artist>;
  findById(id: string): Promise<Artist | null>;
  /** ArtistProfile é único por usuário na plataforma toda (não por estúdio). */
  findByUserId(userId: string): Promise<Artist | null>;
  findByUserAndStudio(userId: string, studioId: string): Promise<Artist | null>;
  update(id: string, data: UpdateArtistData): Promise<Artist>;
  setStyles(id: string, styleIds: string[]): Promise<Artist>;
  listByStudio(studioId: string, opts?: { activeOnly?: boolean }): Promise<Artist[]>;
  listPublic(params: ListPublicArtistsParams): Promise<{ items: Artist[]; total: number }>;
}
