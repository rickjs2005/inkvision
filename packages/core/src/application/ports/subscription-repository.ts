export interface Plan {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  maxArtists: number;
  aiCreditsMonthly: number;
}

export interface ActiveSubscription {
  planId: string;
  planSlug: string;
  maxArtists: number;
  aiCreditsMonthly: number;
  status: string;
  currentPeriodEnd: Date;
}

export interface SubscriptionRepository {
  getPlanBySlug(slug: string): Promise<Plan | null>;
  getActiveForStudio(studioId: string): Promise<ActiveSubscription | null>;
  upsertActive(input: {
    studioId: string;
    planId: string;
    providerRef: string;
    currentPeriodEnd: Date;
  }): Promise<void>;
}

/** Limite gratuito (sem assinatura) — trial. */
export const FREE_TIER_MAX_ARTISTS = 2;
