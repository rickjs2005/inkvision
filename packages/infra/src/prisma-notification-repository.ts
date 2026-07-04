import { Prisma, prisma } from "@inkvision/db";
import type {
  Notification,
  NotificationData,
  NotificationRepository,
} from "@inkvision/core";

/** Notification não é tenant-scoped (por usuário) — cliente base. */
export class PrismaNotificationRepository implements NotificationRepository {
  async create(data: NotificationData): Promise<void> {
    await prisma.notification.create({
      data: { userId: data.userId, type: data.type, payload: data.payload as Prisma.InputJsonValue },
    });
  }

  async createMany(data: NotificationData[]): Promise<void> {
    if (data.length === 0) return;
    await prisma.notification.createMany({
      data: data.map((d) => ({ userId: d.userId, type: d.type, payload: d.payload as Prisma.InputJsonValue })),
    });
  }

  async listForUser(
    userId: string,
    opts?: { unreadOnly?: boolean; take?: number },
  ): Promise<Notification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId, ...(opts?.unreadOnly ? { readAt: null } : {}) },
      orderBy: { createdAt: "desc" },
      take: opts?.take ?? 30,
    });
    return rows.map((n) => ({
      id: n.id,
      type: n.type,
      payload: n.payload as Record<string, unknown>,
      readAt: n.readAt,
      createdAt: n.createdAt,
    }));
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(userId: string, ids?: string[]): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, readAt: null, ...(ids && ids.length ? { id: { in: ids } } : {}) },
      data: { readAt: new Date() },
    });
  }
}
