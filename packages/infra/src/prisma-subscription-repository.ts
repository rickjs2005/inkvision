import { prisma } from "@inkvision/db";
import type {
  ActiveSubscription,
  Plan,
  SubscriptionRepository,
} from "@inkvision/core";

/** Plan e Subscription não são tenant-scoped (fora do RLS). */
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  async getPlanBySlug(slug: string): Promise<Plan | null> {
    const p = await prisma.plan.findUnique({ where: { slug } });
    if (!p) return null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      priceCents: p.priceCents,
      maxArtists: p.maxArtists,
      aiCreditsMonthly: p.aiCreditsMonthly,
    };
  }

  async getActiveForStudio(studioId: string): Promise<ActiveSubscription | null> {
    const sub = await prisma.subscription.findUnique({
      where: { studioId },
      include: { plan: true },
    });
    if (!sub || sub.status !== "active") return null;
    return {
      planId: sub.planId,
      planSlug: sub.plan.slug,
      maxArtists: sub.plan.maxArtists,
      aiCreditsMonthly: sub.plan.aiCreditsMonthly,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
    };
  }

  async upsertActive(input: {
    studioId: string;
    planId: string;
    providerRef: string;
    currentPeriodEnd: Date;
  }): Promise<void> {
    await prisma.subscription.upsert({
      where: { studioId: input.studioId },
      create: {
        studioId: input.studioId,
        planId: input.planId,
        stripeSubscriptionId: input.providerRef,
        status: "active",
        currentPeriodEnd: input.currentPeriodEnd,
      },
      update: {
        planId: input.planId,
        stripeSubscriptionId: input.providerRef,
        status: "active",
        currentPeriodEnd: input.currentPeriodEnd,
      },
    });
  }
}
