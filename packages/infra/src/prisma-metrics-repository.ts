import { prisma, withAdmin } from "@inkvision/db";
import type { CountByKey, MetricsRepository, PlatformMetrics } from "@inkvision/core";

export class PrismaMetricsRepository implements MetricsRepository {
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    // Tabelas fora do RLS — cliente base.
    const [studiosByStatus, users, artists, activeSubs, plans] = await Promise.all([
      prisma.studio.groupBy({ by: ["status"], _count: true }),
      prisma.user.count(),
      prisma.artistProfile.count(),
      prisma.subscription.groupBy({ by: ["planId"], where: { status: "active" }, _count: true }),
      prisma.plan.findMany(),
    ]);

    const studioCount = (s: string) => studiosByStatus.find((x) => x.status === s)?._count ?? 0;
    const planById = new Map(plans.map((p) => [p.id, p]));
    const byPlan: CountByKey[] = activeSubs.map((s) => ({
      key: planById.get(s.planId)?.name ?? s.planId,
      count: s._count,
    }));
    const mrrCents = activeSubs.reduce(
      (sum, s) => sum + (planById.get(s.planId)?.priceCents ?? 0) * s._count,
      0,
    );

    // Tabelas sob RLS (Order, Payment, AiUsageLog) — leitura cross-tenant via admin.
    const rls = await withAdmin(async (tx) => {
      const [ordersTotal, ordersCompleted, aiImages, aiGroups, paidAgg, monthly] = await Promise.all([
        tx.order.count(),
        tx.order.count({ where: { status: { in: ["COMPLETED", "REVIEWED"] } } }),
        tx.aiUsageLog.count({ where: { operation: "simulate" } }),
        tx.aiUsageLog.groupBy({ by: ["provider"], _count: true }),
        tx.payment.aggregate({ where: { status: "SUCCEEDED" }, _sum: { amountCents: true, feeCents: true } }),
        tx.$queryRaw<{ month: Date; cents: bigint }[]>`
          SELECT date_trunc('month', "createdAt") AS month, COALESCE(SUM("amountCents"), 0)::bigint AS cents
          FROM "Payment"
          WHERE status = 'SUCCEEDED' AND "createdAt" > now() - interval '6 months'
          GROUP BY 1 ORDER BY 1`,
      ]);
      return { ordersTotal, ordersCompleted, aiImages, aiGroups, paidAgg, monthly };
    });

    const aiByProvider: CountByKey[] = rls.aiGroups.map((g) => ({ key: g.provider, count: g._count }));
    const monthlyRevenueCents = rls.monthly.map((m) => ({
      month: m.month.toISOString().slice(0, 7),
      cents: Number(m.cents),
    }));

    return {
      mrrCents,
      revenueCents: rls.paidAgg._sum.amountCents ?? 0,
      platformFeeCents: rls.paidAgg._sum.feeCents ?? 0,
      studios: {
        total: studiosByStatus.reduce((n, s) => n + s._count, 0),
        active: studioCount("ACTIVE"),
        pending: studioCount("PENDING"),
        suspended: studioCount("SUSPENDED"),
      },
      users,
      artists,
      orders: { total: rls.ordersTotal, completed: rls.ordersCompleted },
      subscriptions: { active: activeSubs.reduce((n, s) => n + s._count, 0), byPlan },
      aiImages: rls.aiImages,
      aiByProvider,
      monthlyRevenueCents,
    };
  }
}
