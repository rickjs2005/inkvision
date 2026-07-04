import type { StudioRole } from "@inkvision/shared";
import {
  prisma,
  withStudio,
  type Prisma,
  type Studio as PrismaStudio,
} from "@inkvision/db";
import type {
  CreateStudioData,
  ListStudiosParams,
  Studio,
  StudioRepository,
  StudioStatus,
  UpdateStudioData,
} from "@inkvision/core";

function toDomain(s: PrismaStudio): Studio {
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    logoUrl: s.logoUrl,
    description: s.description,
    address: {
      street: s.addressStreet,
      city: s.addressCity,
      state: s.addressState,
      zip: s.addressZip,
    },
    phone: s.phone,
    socials: (s.socials as Record<string, string> | null) ?? null,
    openingHours: s.openingHours,
    status: s.status as StudioStatus,
    stripeAccountId: s.stripeAccountId,
    createdAt: s.createdAt,
  };
}

/**
 * Studio é a raiz do tenant — a própria tabela NÃO está sob RLS, então operações
 * de plataforma usam o cliente base. Já StudioMember é tenant-scoped: addMember
 * roda em withStudio() para satisfazer a extensão (Camada 1) e o RLS (Camada 2).
 */
export class PrismaStudioRepository implements StudioRepository {
  async create(data: CreateStudioData): Promise<Studio> {
    const s = await prisma.studio.create({
      data: { slug: data.slug, name: data.name, description: data.description ?? null },
    });
    return toDomain(s);
  }

  async update(id: string, data: UpdateStudioData): Promise<Studio> {
    const patch: Prisma.StudioUpdateInput = {
      name: data.name,
      logoUrl: data.logoUrl,
      description: data.description,
      phone: data.phone,
      socials: data.socials ?? undefined,
      openingHours: data.openingHours as Prisma.InputJsonValue | undefined,
    };
    if (data.address) {
      patch.addressStreet = data.address.street ?? null;
      patch.addressCity = data.address.city ?? null;
      patch.addressState = data.address.state ?? null;
      patch.addressZip = data.address.zip ?? null;
    }
    const s = await prisma.studio.update({ where: { id }, data: patch });
    return toDomain(s);
  }

  async findById(id: string): Promise<Studio | null> {
    const s = await prisma.studio.findUnique({ where: { id } });
    return s ? toDomain(s) : null;
  }

  async findBySlug(slug: string): Promise<Studio | null> {
    const s = await prisma.studio.findUnique({ where: { slug } });
    return s ? toDomain(s) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await prisma.studio.count({ where: { slug } });
    return count > 0;
  }

  async list(params: ListStudiosParams): Promise<{ items: Studio[]; total: number }> {
    const where: Prisma.StudioWhereInput = {
      status: params.status,
      ...(params.query
        ? { OR: [{ name: { contains: params.query, mode: "insensitive" } }, { slug: { contains: params.query } }] }
        : {}),
    };
    const [rows, total] = await Promise.all([
      prisma.studio.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      prisma.studio.count({ where }),
    ]);
    return { items: rows.map(toDomain), total };
  }

  async setStatus(id: string, status: StudioStatus): Promise<Studio> {
    const s = await prisma.studio.update({ where: { id }, data: { status } });
    return toDomain(s);
  }

  async setStripeAccount(id: string, accountId: string): Promise<Studio> {
    const s = await prisma.studio.update({ where: { id }, data: { stripeAccountId: accountId } });
    return toDomain(s);
  }

  async delete(id: string): Promise<void> {
    await prisma.studio.delete({ where: { id } });
  }

  async addMember(studioId: string, userId: string, role: StudioRole): Promise<void> {
    // studioId explícito satisfaz o tipo do Prisma; a extensão (Camada 1) o
    // reconfirma e o RLS (Camada 2) é ativado por withStudio.
    await withStudio(studioId, (tx) =>
      tx.studioMember.create({ data: { studioId, userId, role } }),
    );
  }
}
