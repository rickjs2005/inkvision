import { prisma } from "@inkvision/db";
import type { DesignRepository, DesignStatus, DesignVersion } from "@inkvision/core";

function toDomain(d: {
  id: string;
  orderId: string;
  version: number;
  imageUrl: string;
  notes: string | null;
  status: string;
  feedback: string | null;
  createdAt: Date;
}): DesignVersion {
  return {
    id: d.id,
    orderId: d.orderId,
    version: d.version,
    imageUrl: d.imageUrl,
    notes: d.notes,
    status: d.status as DesignStatus,
    feedback: d.feedback,
    createdAt: d.createdAt,
  };
}

/** DesignVersion não é tenant-scoped (pertence ao pedido) — cliente base. */
export class PrismaDesignRepository implements DesignRepository {
  async create(orderId: string, imageUrl: string, notes: string | null): Promise<DesignVersion> {
    const last = await prisma.designVersion.findFirst({
      where: { orderId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const version = (last?.version ?? 0) + 1;
    const created = await prisma.designVersion.create({
      data: { orderId, version, imageUrl, notes, status: "PENDING" },
    });
    return toDomain(created);
  }

  async getLatest(orderId: string): Promise<DesignVersion | null> {
    const d = await prisma.designVersion.findFirst({ where: { orderId }, orderBy: { version: "desc" } });
    return d ? toDomain(d) : null;
  }

  async getLatestApproved(orderId: string): Promise<DesignVersion | null> {
    const d = await prisma.designVersion.findFirst({
      where: { orderId, status: "APPROVED" },
      orderBy: { version: "desc" },
    });
    return d ? toDomain(d) : null;
  }

  async listForOrder(orderId: string): Promise<DesignVersion[]> {
    const rows = await prisma.designVersion.findMany({ where: { orderId }, orderBy: { version: "asc" } });
    return rows.map(toDomain);
  }

  async setStatus(id: string, status: DesignStatus, feedback: string | null): Promise<DesignVersion> {
    const d = await prisma.designVersion.update({ where: { id }, data: { status, feedback } });
    return toDomain(d);
  }
}
