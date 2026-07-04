import { prisma } from "@inkvision/db";
import type { Style, StyleRepository } from "@inkvision/core";

/** Style é global (não tenant-scoped). */
export class PrismaStyleRepository implements StyleRepository {
  async listAll(): Promise<Style[]> {
    return prisma.style.findMany({ orderBy: { name: "asc" }, select: { id: true, slug: true, name: true } });
  }
  async countByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return prisma.style.count({ where: { id: { in: ids } } });
  }
}
