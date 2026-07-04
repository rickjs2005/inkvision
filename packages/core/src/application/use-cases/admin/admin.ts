import { type Actor, assertAuthenticated, assertPlatformAdmin } from "../../../domain/actor";
import type {
  AuditReadRepository,
  LgpdRepository,
  MetricsRepository,
  PlatformMetrics,
  AuditLogEntry,
} from "../../ports/admin-repository";

export interface AdminUseCaseDeps {
  metrics: MetricsRepository;
  audit: AuditReadRepository;
  lgpd: LgpdRepository;
}

export class GetPlatformMetricsUseCase {
  constructor(private readonly deps: Pick<AdminUseCaseDeps, "metrics">) {}
  async execute(actor: Actor): Promise<PlatformMetrics> {
    assertPlatformAdmin(actor);
    return this.deps.metrics.getPlatformMetrics();
  }
}

export class ListAuditLogsUseCase {
  constructor(private readonly deps: Pick<AdminUseCaseDeps, "audit">) {}
  async execute(
    actor: Actor,
    params: { page?: number; perPage?: number; action?: string },
  ): Promise<{ items: AuditLogEntry[]; total: number; page: number; perPage: number }> {
    assertPlatformAdmin(actor);
    const page = Math.max(1, params.page ?? 1);
    const perPage = Math.min(100, params.perPage ?? 30);
    const { items, total } = await this.deps.audit.list({
      skip: (page - 1) * perPage,
      take: perPage,
      action: params.action,
    });
    return { items, total, page, perPage };
  }
}

/** LGPD — o próprio titular exporta seus dados. */
export class ExportMyDataUseCase {
  constructor(private readonly deps: Pick<AdminUseCaseDeps, "lgpd">) {}
  async execute(actor: Actor | null): Promise<Record<string, unknown>> {
    assertAuthenticated(actor);
    return this.deps.lgpd.exportUserData(actor.userId);
  }
}

/** LGPD — o próprio titular solicita a eliminação (anonimização). */
export class DeleteMyAccountUseCase {
  constructor(private readonly deps: Pick<AdminUseCaseDeps, "lgpd">) {}
  async execute(actor: Actor | null): Promise<void> {
    assertAuthenticated(actor);
    await this.deps.lgpd.anonymizeUser(actor.userId);
  }
}
