import { Prisma, prisma, withStudio } from "@inkvision/db";
import type {
  Artist,
  ArtistRepository,
  ListPublicArtistsParams,
  UpdateArtistData,
} from "@inkvision/core";

const artistInclude = {
  user: { select: { name: true } },
  styles: { include: { style: { select: { id: true, slug: true, name: true } } } },
} satisfies Prisma.ArtistProfileInclude;

type ArtistRow = Prisma.ArtistProfileGetPayload<{ include: typeof artistInclude }>;

function toDomain(a: ArtistRow): Artist {
  return {
    id: a.id,
    studioId: a.studioId,
    userId: a.userId,
    name: a.user.name,
    bio: a.bio,
    experienceYears: a.experienceYears,
    instagram: a.instagram,
    avgPriceCents: a.avgPriceCents,
    avgResponseMin: a.avgResponseMin,
    ratingAvg: a.ratingAvg ? Number(a.ratingAvg) : null,
    ratingCount: a.ratingCount,
    isActive: a.isActive,
    styles: a.styles.map((s) => s.style),
  };
}

/**
 * ArtistProfile é público-legível (SELECT liberado pelo RLS) mas tenant-gravável.
 * Leituras usam o cliente base; escritas passam por withStudio (Camadas 1 + 2).
 */
export class PrismaArtistRepository implements ArtistRepository {
  async addArtist(studioId: string, userId: string): Promise<Artist> {
    const created = await withStudio(studioId, (tx) =>
      tx.artistProfile.create({ data: { studioId, userId } }),
    );
    return this.mustFindById(created.id);
  }

  /**
   * Cria o StudioMember (role ARTIST) e o ArtistProfile na mesma transação
   * `withStudio`, para que uma falha em qualquer uma das duas escritas (ex.:
   * violação do @unique global de ArtistProfile.userId) desfaça a outra —
   * sem isso, um StudioMember órfão fica gravado.
   */
  async addArtistWithMembership(studioId: string, userId: string): Promise<Artist> {
    const created = await withStudio(studioId, async (tx) => {
      await tx.studioMember.create({ data: { studioId, userId, role: "ARTIST" } });
      return tx.artistProfile.create({ data: { studioId, userId } });
    });
    return this.mustFindById(created.id);
  }

  async findById(id: string): Promise<Artist | null> {
    const a = await prisma.artistProfile.findUnique({ where: { id }, include: artistInclude });
    return a ? toDomain(a) : null;
  }

  /** ArtistProfile.userId é @unique globalmente — no máximo um por usuário. */
  async findByUserId(userId: string): Promise<Artist | null> {
    const a = await prisma.artistProfile.findUnique({ where: { userId }, include: artistInclude });
    return a ? toDomain(a) : null;
  }

  async findByUserAndStudio(userId: string, studioId: string): Promise<Artist | null> {
    const a = await prisma.artistProfile.findFirst({
      where: { userId, studioId },
      include: artistInclude,
    });
    return a ? toDomain(a) : null;
  }

  async update(id: string, data: UpdateArtistData): Promise<Artist> {
    const current = await prisma.artistProfile.findUnique({ where: { id }, select: { studioId: true } });
    if (!current) throw new Error("ArtistProfile não encontrado");
    await withStudio(current.studioId, (tx) =>
      tx.artistProfile.update({
        where: { id },
        data: {
          bio: data.bio,
          experienceYears: data.experienceYears,
          instagram: data.instagram,
          avgPriceCents: data.avgPriceCents,
          isActive: data.isActive,
        },
      }),
    );
    return this.mustFindById(id);
  }

  async setStyles(id: string, styleIds: string[]): Promise<Artist> {
    // ArtistStyle é join sem studioId (fora do RLS) — troca atômica no cliente base.
    await prisma.$transaction([
      prisma.artistStyle.deleteMany({ where: { artistId: id } }),
      prisma.artistStyle.createMany({
        data: styleIds.map((styleId) => ({ artistId: id, styleId })),
        skipDuplicates: true,
      }),
    ]);
    return this.mustFindById(id);
  }

  async listByStudio(studioId: string, opts?: { activeOnly?: boolean }): Promise<Artist[]> {
    const rows = await prisma.artistProfile.findMany({
      where: { studioId, ...(opts?.activeOnly ? { isActive: true } : {}) },
      include: artistInclude,
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDomain);
  }

  async listPublic(params: ListPublicArtistsParams): Promise<{ items: Artist[]; total: number }> {
    const where: Prisma.ArtistProfileWhereInput = {
      isActive: true,
      studio: {
        status: "ACTIVE",
        ...(params.city ? { addressCity: { contains: params.city, mode: "insensitive" } } : {}),
        ...(params.studioName ? { name: { contains: params.studioName, mode: "insensitive" } } : {}),
      },
      ...(params.styleSlug ? { styles: { some: { style: { slug: params.styleSlug } } } } : {}),
      ...(params.query ? { user: { name: { contains: params.query, mode: "insensitive" } } } : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.artistProfile.findMany({
        where,
        include: artistInclude,
        orderBy: [{ ratingAvg: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        skip: params.skip,
        take: params.take,
      }),
      prisma.artistProfile.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  }

  private async mustFindById(id: string): Promise<Artist> {
    const a = await this.findById(id);
    if (!a) throw new Error("ArtistProfile não encontrado após escrita");
    return a;
  }
}
