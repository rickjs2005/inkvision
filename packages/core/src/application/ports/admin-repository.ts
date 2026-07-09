export interface CountByKey {
  key: string;
  count: number;
}

/**
 * Cada métrica é populada por uma query independente no repositório. `null`
 * sinaliza que a query específica falhou (ex.: contenção no banco) — distinto
 * de `0`/`[]`, que é um dado real. A UI deve renderizar `null` como
 * "indisponível" em vez de tratá-lo como zero/vazio.
 */
export interface PlatformMetrics {
  mrrCents: number | null;
  revenueCents: number | null; // pagamentos concluídos (bruto)
  platformFeeCents: number | null; // taxa retida pela plataforma
  studios: {
    total: number | null;
    active: number | null;
    pending: number | null;
    suspended: number | null;
  };
  users: number | null;
  artists: number | null;
  orders: { total: number | null; completed: number | null };
  subscriptions: { active: number | null; byPlan: CountByKey[] | null };
  aiImages: number | null;
  aiByProvider: CountByKey[] | null;
  monthlyRevenueCents: { month: string; cents: number }[] | null; // últimos 6 meses
}

export interface AuditLogEntry {
  id: string;
  studioId: string | null;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  ip: string | null;
  createdAt: Date;
}

export interface MetricsRepository {
  getPlatformMetrics(): Promise<PlatformMetrics>;
}

export interface AuditReadRepository {
  list(params: { skip: number; take: number; action?: string }): Promise<{
    items: AuditLogEntry[];
    total: number;
  }>;
}

/** Direitos do titular (LGPD): portabilidade e eliminação. */
export interface LgpdRepository {
  exportUserData(userId: string): Promise<Record<string, unknown>>;
  /** Anonimiza o usuário (mantém integridade referencial de pedidos/avaliações). */
  anonymizeUser(userId: string): Promise<void>;
}
