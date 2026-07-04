import type {
  Artist,
  ArtistRepository,
  ListPublicArtistsParams,
  UpdateArtistData,
} from "../application/ports/artist-repository";
import type {
  CreatePortfolioItemData,
  PortfolioComment,
  PortfolioItem,
  PortfolioRepository,
  UpdatePortfolioItemData,
} from "../application/ports/portfolio-repository";
import type { StyleRepository } from "../application/ports/style-repository";

let seq = 0;
const id = (p: string) => `${p}_${(++seq).toString(36)}`;

export class InMemoryArtistRepo implements ArtistRepository {
  artists: Artist[] = [];

  seed(a: Partial<Artist> & Pick<Artist, "userId" | "studioId">): Artist {
    const artist: Artist = {
      id: a.id ?? id("artist"),
      studioId: a.studioId,
      userId: a.userId,
      name: a.name ?? "Artista",
      bio: a.bio ?? null,
      experienceYears: a.experienceYears ?? null,
      instagram: a.instagram ?? null,
      avgPriceCents: a.avgPriceCents ?? null,
      avgResponseMin: a.avgResponseMin ?? null,
      ratingAvg: a.ratingAvg ?? null,
      ratingCount: a.ratingCount ?? 0,
      isActive: a.isActive ?? true,
      styles: a.styles ?? [],
    };
    this.artists.push(artist);
    return artist;
  }

  async addArtist(studioId: string, userId: string) {
    return this.seed({ studioId, userId });
  }
  async findById(idv: string) {
    return this.artists.find((a) => a.id === idv) ?? null;
  }
  async findByUserAndStudio(userId: string, studioId: string) {
    return this.artists.find((a) => a.userId === userId && a.studioId === studioId) ?? null;
  }
  async update(idv: string, data: UpdateArtistData) {
    const a = this.artists.find((x) => x.id === idv)!;
    Object.assign(a, data);
    return a;
  }
  async setStyles(idv: string, styleIds: string[]) {
    const a = this.artists.find((x) => x.id === idv)!;
    a.styles = styleIds.map((sid) => ({ id: sid, slug: sid, name: sid }));
    return a;
  }
  async listByStudio(studioId: string) {
    return this.artists.filter((a) => a.studioId === studioId);
  }
  async listPublic(_params: ListPublicArtistsParams) {
    const items = this.artists.filter((a) => a.isActive);
    return { items, total: items.length };
  }
}

export class InMemoryPortfolioRepo implements PortfolioRepository {
  items: PortfolioItem[] = [];
  likes = new Set<string>();
  comments: PortfolioComment[] = [];

  async create(data: CreatePortfolioItemData) {
    const item: PortfolioItem = {
      id: id("item"),
      studioId: data.studioId,
      artistId: data.artistId,
      type: data.type,
      mediaUrl: data.mediaUrl,
      beforeUrl: data.beforeUrl ?? null,
      afterUrl: data.afterUrl ?? null,
      description: data.description ?? null,
      tags: data.tags,
      styleId: data.styleId ?? null,
      likesCount: 0,
      createdAt: new Date(0),
    };
    this.items.push(item);
    return item;
  }
  async update(idv: string, data: UpdatePortfolioItemData) {
    const it = this.items.find((x) => x.id === idv)!;
    Object.assign(it, data);
    return it;
  }
  async delete(idv: string) {
    this.items = this.items.filter((x) => x.id !== idv);
  }
  async findById(idv: string) {
    return this.items.find((x) => x.id === idv) ?? null;
  }
  async listByArtist(artistId: string) {
    return this.items.filter((x) => x.artistId === artistId);
  }
  async toggleLike(itemId: string, userId: string) {
    const key = `${userId}:${itemId}`;
    const liked = !this.likes.has(key);
    if (liked) this.likes.add(key);
    else this.likes.delete(key);
    const likesCount = [...this.likes].filter((k) => k.endsWith(`:${itemId}`)).length;
    return { liked, likesCount };
  }
  async addComment(itemId: string, userId: string, body: string) {
    const c: PortfolioComment = {
      id: id("cmt"),
      itemId,
      userId,
      authorName: "User",
      body,
      createdAt: new Date(0),
    };
    this.comments.push(c);
    return c;
  }
  async listComments(itemId: string) {
    return this.comments.filter((c) => c.itemId === itemId);
  }
}

export class InMemoryStyleRepo implements StyleRepository {
  constructor(private ids: string[] = []) {}
  async listAll() {
    return this.ids.map((i) => ({ id: i, slug: i, name: i }));
  }
  async countByIds(ids: string[]) {
    return ids.filter((i) => this.ids.includes(i)).length;
  }
}

import type {
  ActiveSubscription,
  SubscriptionRepository,
} from "../application/ports/subscription-repository";

export class InMemorySubscriptionRepo implements SubscriptionRepository {
  active = new Map<string, ActiveSubscription>();
  plans = [
    { id: "plan_starter", slug: "starter", name: "Starter", priceCents: 9900, maxArtists: 2, aiCreditsMonthly: 50 },
    { id: "plan_pro", slug: "pro", name: "Pro", priceCents: 24900, maxArtists: 8, aiCreditsMonthly: 300 },
  ];
  async getPlanBySlug(slug: string) {
    return this.plans.find((p) => p.slug === slug) ?? null;
  }
  async getActiveForStudio(studioId: string) {
    return this.active.get(studioId) ?? null;
  }
  async upsertActive(input: { studioId: string; planId: string; providerRef: string; currentPeriodEnd: Date }) {
    const plan = this.plans.find((p) => p.id === input.planId)!;
    this.active.set(input.studioId, {
      planId: plan.id,
      planSlug: plan.slug,
      maxArtists: plan.maxArtists,
      aiCreditsMonthly: plan.aiCreditsMonthly,
      status: "active",
      currentPeriodEnd: input.currentPeriodEnd,
    });
  }
}
