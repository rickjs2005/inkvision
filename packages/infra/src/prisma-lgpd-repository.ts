import { prisma, withUser } from "@inkvision/db";
import type { LgpdRepository } from "@inkvision/core";

export class PrismaLgpdRepository implements LgpdRepository {
  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    // Pedidos e avaliações do titular (contexto de cliente dono).
    const { orders, reviews } = await withUser(userId, async (tx) => {
      const orders = await tx.order.findMany({
        where: { clientId: userId },
        select: { id: true, bodyPart: true, briefing: true, status: true, createdAt: true },
      });
      const reviews = await tx.review.findMany({
        where: { clientId: userId },
        select: { rating: true, comment: true, createdAt: true },
      });
      return { orders, reviews };
    });

    const [messages, notifications] = await Promise.all([
      prisma.message.findMany({
        where: { senderId: userId },
        select: { kind: true, body: true, createdAt: true },
      }),
      prisma.notification.findMany({
        where: { userId },
        select: { type: true, payload: true, createdAt: true },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      orders,
      reviews,
      messages,
      notifications,
    };
  }

  async anonymizeUser(userId: string): Promise<void> {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: "Usuário removido",
          email: `deleted-${userId}@removed.invalid`,
          phone: null,
          image: null,
        },
      }),
      // Impede novos logins.
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      // Remove notificações e apaga o conteúdo das mensagens enviadas.
      prisma.notification.deleteMany({ where: { userId } }),
      prisma.message.updateMany({ where: { senderId: userId }, data: { body: "[removido]", attachmentUrl: null } }),
    ]);
  }
}
