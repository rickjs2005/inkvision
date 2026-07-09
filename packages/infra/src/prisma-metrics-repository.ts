import { prisma, withAdmin } from "@inkvision/db";
import type { CountByKey, MetricsRepository, PlatformMetrics } from "@inkvision/core";

/**
 * Executa `fn` isoladamente; em falha, loga e retorna `null` em vez de propagar.
 * Permite que uma métrica indisponível (ex.: contenção no banco) não derrube o
 * dashboard inteiro — cada query vira uma métrica independente que pode falhar
 * sem afetar as demais. `null` é distinto de `0`/`[]` (dado real).
 */
async function safe<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[metrics] falha ao coletar "${label}":`, err);
    return null;
  }
}

export class PrismaMetricsRepository implements MetricsRepository {
  async getPlatformMetrics(): Promise<PlatformMetrics> {
    // Tabelas fora do RLS — cliente base. Cada métrica isolada em seu próprio
    // try/catch (via `safe`): uma falha aqui não derruba as outras.
    const [studiosByStatus, users, artists, subsAndPlans] = await Promise.all([
      safe(() => prisma.studio.groupBy({ by: ["status"], _count: true }), "studiosByStatus"),
      safe(() => prisma.user.count(), "users"),
      safe(() => prisma.artistProfile.count(), "artists"),
      safe(async () => {
        const [activeSubs, plans] = await Promise.all([
          prisma.subscription.groupBy({ by: ["planId"], where: { status: "active" }, _count: true }),
          prisma.plan.findMany(),
        ]);
        return { activeSubs, plans };
      }, "subscriptions+plans"),
    ]);

    const studioCount = (s: string) =>
      studiosByStatus === null ? null : studiosByStatus.find((x) => x.status === s)?._count ?? 0;

    const activeSubs = subsAndPlans?.activeSubs ?? null;
    const planById = new Map((subsAndPlans?.plans ?? []).map((p) => [p.id, p]));
    const byPlan: CountByKey[] | null = activeSubs
      ? activeSubs.map((s) => ({ key: planById.get(s.planId)?.name ?? s.planId, count: s._count }))
      : null;
    const mrrCents = activeSubs
      ? activeSubs.reduce((sum, s) => sum + (planById.get(s.planId)?.priceCents ?? 0) * s._count, 0)
      : null;

    // Tabelas sob RLS (Order, Payment, AiUsageLog) — leitura cross-tenant via admin.
    // Cada query roda na sua própria transação `withAdmin`: se uma abortar (ex.:
    // erro que invalida a transação no Postgres), não contamina as demais.
    const [ordersTotal, ordersCompleted, aiImages, aiGroups, paidAgg, monthly] = await Promise.all([
      safe(() => withAdmin((tx) => tx.order.count()), "ordersTotal"),
      safe(
        () => withAdmin((tx) => tx.order.count({ where: { status: { in: ["COMPLETED", "REVIEWED"] } } })),
        "ordersCompleted",
      ),
      safe(() => withAdmin((tx) => tx.aiUsageLog.count({ where: { operation: "simulate" } })), "aiImages"),
      safe(() => withAdmin((tx) => tx.aiUsageLog.groupBy({ by: ["provider"], _count: true })), "aiGroups"),
      safe(
        () =>
          withAdmin((tx) =>
            tx.payment.aggregate({
              where: { status: "SUCCEEDED" },
              _sum: { amountCents: true, feeCents: true },
            }),
          ),
        "paidAgg",
      ),
      safe(
        () =>
          withAdmin((tx) =>
            tx.$queryRaw<{ month: Date; cents: bigint }[]>`
              SELECT date_trunc('month', "createdAt") AS month, COALESCE(SUM("amountCents"), 0)::bigint AS cents
              FROM "Payment"
              WHERE status = 'SUCCEEDED' AND "createdAt" > now() - interval '6 months'
              GROUP BY 1 ORDER BY 1`,
          ),
        "monthly",
      ),
    ]);

    const aiByProvider: CountByKey[] | null = aiGroups
      ? aiGroups.map((g) => ({ key: g.provider, count: g._count }))
      : null;
    const monthlyRevenueCents = monthly
      ? monthly.map((m) => ({ month: m.month.toISOString().slice(0, 7), cents: Number(m.cents) }))
      : null;

    return {
      mrrCents,
      revenueCents: paidAgg ? paidAgg._sum.amountCents ?? 0 : null,
      platformFeeCents: paidAgg ? paidAgg._sum.feeCents ?? 0 : null,
      studios: {
        total: studiosByStatus ? studiosByStatus.reduce((n, s) => n + s._count, 0) : null,
        active: studioCount("ACTIVE"),
        pending: studioCount("PENDING"),
        suspended: studioCount("SUSPENDED"),
      },
      users,
      artists,
      orders: { total: ordersTotal, completed: ordersCompleted },
      subscriptions: {
        active: activeSubs ? activeSubs.reduce((n, s) => n + s._count, 0) : null,
        byPlan,
      },
      aiImages,
      aiByProvider,
      monthlyRevenueCents,
    };
  }
}
