import { Prisma, prisma, withStudio } from "@inkvision/db";
import type {
  CreatePortfolioItemData,
  PortfolioComment,
  PortfolioItem,
  PortfolioRepository,
  UpdatePortfolioItemData,
} from "@inkvision/core";

type ItemRow = Prisma.PortfolioItemGetPayload<{
  include: { _count: { select: { likes: true } }; likes: true };
}>;

function toDomain(row: ItemRow, viewerUserId?: string): PortfolioItem {
  return {
    id: row.id,
    studioId: row.studioId,
    artistId: row.artistId,
    type: row.type,
    mediaUrl: row.mediaUrl,
    beforeUrl: row.beforeUrl,
    afterUrl: row.afterUrl,
    description: row.description,
    tags: row.tags,
    styleId: row.styleId,
    likesCount: row._count.likes,
    createdAt: row.createdAt,
    likedByViewer: viewerUserId ? row.likes.some((l) => l.userId === viewerUserId) : undefined,
  };
}

/**
 * PortfolioItem: público-legível, tenant-gravável (create/update/delete via
 * withStudio). Likes/comentários vêm de qualquer usuário e vivem em tabelas sem
 * studioId (fora do RLS); likesCount é derivado da contagem de likes.
 */
export class PrismaPortfolioRepository implements PortfolioRepository {
  async create(data: CreatePortfolioItemData): Promise<PortfolioItem> {
    const created = await withStudio(data.studioId, (tx) =>
      tx.portfolioItem.create({
        data: {
          studioId: data.studioId,
          artistId: data.artistId,
          type: data.type,
          mediaUrl: data.mediaUrl,
          beforeUrl: data.beforeUrl ?? null,
          afterUrl: data.afterUrl ?? null,
          description: data.description ?? null,
          tags: data.tags,
          styleId: data.styleId ?? null,
        },
      }),
    );
    return this.mustFindById(created.id);
  }

  async update(id: string, data: UpdatePortfolioItemData): Promise<PortfolioItem> {
    const current = await prisma.portfolioItem.findUnique({ where: { id }, select: { studioId: true } });
    if (!current) throw new Error("PortfolioItem não encontrado");
    await withStudio(current.studioId, (tx) =>
      tx.portfolioItem.update({
        where: { id },
        data: { description: data.description, tags: data.tags, styleId: data.styleId },
      }),
    );
    return this.mustFindById(id);
  }

  async delete(id: string): Promise<void> {
    const current = await prisma.portfolioItem.findUnique({ where: { id }, select: { studioId: true } });
    if (!current) return;
    await withStudio(current.studioId, (tx) => tx.portfolioItem.delete({ where: { id } }));
  }

  async findById(id: string): Promise<PortfolioItem | null> {
    const row = await prisma.portfolioItem.findUnique({
      where: { id },
      include: { _count: { select: { likes: true } }, likes: true },
    });
    return row ? toDomain(row) : null;
  }

  async listByArtist(artistId: string, viewerUserId?: string): Promise<PortfolioItem[]> {
    const rows = await prisma.portfolioItem.findMany({
      where: { artistId },
      include: { _count: { select: { likes: true } }, likes: true },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => toDomain(r, viewerUserId));
  }

  async toggleLike(itemId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const existing = await prisma.portfolioLike.findUnique({
      where: { userId_itemId: { userId, itemId } },
    });
    if (existing) {
      await prisma.portfolioLike.delete({ where: { userId_itemId: { userId, itemId } } });
    } else {
      await prisma.portfolioLike.create({ data: { userId, itemId } });
    }
    const likesCount = await prisma.portfolioLike.count({ where: { itemId } });
    return { liked: !existing, likesCount };
  }

  async addComment(itemId: string, userId: string, body: string): Promise<PortfolioComment> {
    const [comment, user] = await Promise.all([
      prisma.portfolioComment.create({ data: { itemId, userId, body } }),
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    ]);
    return {
      id: comment.id,
      itemId: comment.itemId,
      userId: comment.userId,
      authorName: user?.name ?? "Usuário",
      body: comment.body,
      createdAt: comment.createdAt,
    };
  }

  async listComments(itemId: string): Promise<PortfolioComment[]> {
    const comments = await prisma.portfolioComment.findMany({
      where: { itemId },
      orderBy: { createdAt: "asc" },
    });
    if (comments.length === 0) return [];
    const users = await prisma.user.findMany({
      where: { id: { in: [...new Set(comments.map((c) => c.userId))] } },
      select: { id: true, name: true },
    });
    const nameById = new Map(users.map((u) => [u.id, u.name]));
    return comments.map((c) => ({
      id: c.id,
      itemId: c.itemId,
      userId: c.userId,
      authorName: nameById.get(c.userId) ?? "Usuário",
      body: c.body,
      createdAt: c.createdAt,
    }));
  }

  private async mustFindById(id: string): Promise<PortfolioItem> {
    const item = await this.findById(id);
    if (!item) throw new Error("PortfolioItem não encontrado após escrita");
    return item;
  }
}
