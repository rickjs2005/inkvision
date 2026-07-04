export interface CountByKey {
  key: string;
  count: number;
}

export interface PlatformMetrics {
  mrrCents: number;
  revenueCents: number; // pagamentos concluídos (bruto)
  platformFeeCents: number; // taxa retida pela plataforma
  studios: { total: number; active: number; pending: number; suspended: number };
  users: number;
  artists: number;
  orders: { total: number; completed: number };
  subscriptions: { active: number; byPlan: CountByKey[] };
  aiImages: number;
  aiByProvider: CountByKey[];
  monthlyRevenueCents: { month: string; cents: number }[]; // últimos 6 meses
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
