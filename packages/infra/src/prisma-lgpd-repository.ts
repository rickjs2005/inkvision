import { prisma, withAdmin, withUser } from "@inkvision/db";
import type { LgpdRepository, StorageService } from "@inkvision/core";

export class PrismaLgpdRepository implements LgpdRepository {
  constructor(private readonly storage: StorageService) {}

  async exportUserData(userId: string): Promise<Record<string, unknown>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });

    // Pedidos e avaliações do titular (contexto de cliente dono). Referências
    // e simulações vêm junto — são as fotos/artes que o titular tem direito de
    // ver na portabilidade (Art. 18-V), não só metadados de pedido.
    const { orders, reviews } = await withUser(userId, async (tx) => {
      const orders = await tx.order.findMany({
        where: { clientId: userId },
        select: {
          id: true,
          bodyPart: true,
          briefing: true,
          status: true,
          createdAt: true,
          references: { select: { fileUrl: true, note: true } },
          simulations: {
            select: { bodyPhotoUrl: true, designUrl: true, variants: true, status: true, createdAt: true },
          },
        },
      });
      const reviews = await tx.review.findMany({
        where: { clientId: userId },
        select: { rating: true, comment: true, createdAt: true },
      });
      return { orders, reviews };
    });

    const orderIds = orders.map((o) => o.id);
    const [messages, notifications, payments] = await Promise.all([
      prisma.message.findMany({
        where: { senderId: userId },
        select: { kind: true, body: true, createdAt: true },
      }),
      prisma.notification.findMany({
        where: { userId },
        select: { type: true, payload: true, createdAt: true },
      }),
      // Payment tem RLS restrito ao tenant (grupo studio_only em rls.sql) — o
      // titular não é o tenant, então só dá pra ler via bypass admin, com o
      // filtro explícito por orderId (os próprios pedidos dele) garantindo que
      // não vaza pagamento de mais ninguém.
      orderIds.length
        ? withAdmin((tx) =>
            tx.payment.findMany({
              where: { orderId: { in: orderIds } },
              select: { kind: true, amountCents: true, status: true, createdAt: true },
            }),
          )
        : Promise.resolve([]),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user,
      orders,
      reviews,
      messages,
      notifications,
      payments,
    };
  }

  async anonymizeUser(userId: string): Promise<void> {
    // Levanta TODAS as URLs de mídia do titular antes de anonimizar — depois
    // da transação abaixo elas já estarão desvinculadas do banco (image/
    // attachmentUrl zerados), e sem isso o objeto ficaria órfão no bucket,
    // continuando acessível pela URL pública mesmo após a "exclusão".
    const [user, orders, messages, portfolioItems] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { image: true } }),
      prisma.order.findMany({
        where: { clientId: userId },
        select: {
          references: { select: { fileUrl: true } },
          simulations: { select: { bodyPhotoUrl: true, composedImageUrl: true } },
        },
      }),
      prisma.message.findMany({
        where: { senderId: userId, attachmentUrl: { not: null } },
        select: { attachmentUrl: true },
      }),
      // Se o titular também é tatuador, o portfólio dele (incluindo fotos de
      // antes/depois de clientes) precisa ser apagado do bucket também — sem
      // isso, essa mídia continua pública mesmo com a conta "excluída".
      prisma.portfolioItem.findMany({
        where: { artist: { userId } },
        select: { mediaUrl: true, beforeUrl: true, afterUrl: true },
      }),
    ]);

    const mediaUrls = [
      user?.image,
      ...orders.flatMap((o) => o.references.map((r) => r.fileUrl)),
      ...orders.flatMap((o) => o.simulations.flatMap((s) => [s.bodyPhotoUrl, s.composedImageUrl])),
      ...messages.map((m) => m.attachmentUrl),
      ...portfolioItems.flatMap((p) => [p.mediaUrl, p.beforeUrl, p.afterUrl]),
    ].filter((url): url is string => Boolean(url));

    // Best-effort, mas NUNCA silencioso: se o storage falhar (rede, credencial
    // expirada, rate limit), a anonimização do banco não pode travar por isso
    // — mas o objeto órfão precisa aparecer em algum log para correção manual,
    // senão a falha vira uma "exclusão" que não excluiu nada e ninguém saberia.
    await Promise.all(
      mediaUrls.map((url) =>
        this.storage.deleteByPublicUrl(url).catch((e) => {
          console.error(`[lgpd] falha ao apagar mídia do titular ${userId} (${url}):`, e);
        }),
      ),
    );

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
