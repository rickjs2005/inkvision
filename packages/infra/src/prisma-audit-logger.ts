import { prisma, type Prisma } from "@inkvision/db";
import type { AuditEntry, AuditLogger } from "@inkvision/core";

/** AuditLog não é tenant-scoped (não está sob RLS) — grava no cliente base. */
export class PrismaAuditLogger implements AuditLogger {
  async log(entry: AuditEntry): Promise<void> {
    await prisma.auditLog.create({
      data: {
        studioId: entry.studioId ?? null,
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: (entry.metadata as Prisma.InputJsonValue) ?? undefined,
        ip: entry.ip ?? null,
      },
    });
  }
}
