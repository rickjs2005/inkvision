import { prisma } from "@inkvision/db";
import type { AuditLogEntry, AuditReadRepository } from "@inkvision/core";

/** AuditLog não é tenant-scoped — leitura direta pelo admin. */
export class PrismaAuditReadRepository implements AuditReadRepository {
  async list(params: { skip: number; take: number; action?: string }) {
    const where = params.action ? { action: { contains: params.action } } : {};
    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      prisma.auditLog.count({ where }),
    ]);
    const items: AuditLogEntry[] = rows.map((r) => ({
      id: r.id,
      studioId: r.studioId,
      userId: r.userId,
      action: r.action,
      entity: r.entity,
      entityId: r.entityId,
      metadata: r.metadata,
      ip: r.ip,
      createdAt: r.createdAt,
    }));
    return { items, total };
  }
}
