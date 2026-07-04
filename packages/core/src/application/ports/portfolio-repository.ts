export type MediaKind = "IMAGE" | "VIDEO" | "BEFORE_AFTER";

export interface PortfolioItem {
  id: string;
  studioId: string;
  artistId: string;
  type: MediaKind;
  mediaUrl: string;
  beforeUrl?: string | null;
  afterUrl?: string | null;
  description?: string | null;
  tags: string[];
  styleId?: string | null;
  likesCount: number;
  createdAt: Date;
  likedByViewer?: boolean;
}

export interface PortfolioComment {
  id: string;
  itemId: string;
  userId: string;
  authorName: string;
  body: string;
  createdAt: Date;
}

export interface CreatePortfolioItemData {
  studioId: string;
  artistId: string;
  type: MediaKind;
  mediaUrl: string;
  beforeUrl?: string | null;
  afterUrl?: string | null;
  description?: string | null;
  tags: string[];
  styleId?: string | null;
}

export interface UpdatePortfolioItemData {
  description?: string | null;
  tags?: string[];
  styleId?: string | null;
}

export interface PortfolioRepository {
  create(data: CreatePortfolioItemData): Promise<PortfolioItem>;
  update(id: string, data: UpdatePortfolioItemData): Promise<PortfolioItem>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<PortfolioItem | null>;
  listByArtist(artistId: string, viewerUserId?: string): Promise<PortfolioItem[]>;
  /** Alterna o like do usuário. Retorna estado final e contagem. */
  toggleLike(itemId: string, userId: string): Promise<{ liked: boolean; likesCount: number }>;
  addComment(itemId: string, userId: string, body: string): Promise<PortfolioComment>;
  listComments(itemId: string): Promise<PortfolioComment[]>;
}
