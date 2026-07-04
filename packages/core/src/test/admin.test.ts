import { describe, expect, it } from "vitest";
import type { Actor } from "../domain/actor";
import type { MetricsRepository, PlatformMetrics, LgpdRepository } from "../application/ports/admin-repository";
import {
  DeleteMyAccountUseCase,
  ExportMyDataUseCase,
  GetPlatformMetricsUseCase,
} from "../application/use-cases/admin/admin";

const admin: Actor = { userId: "u_admin", platformRole: "ADMIN", memberships: [] };
const regular: Actor = { userId: "u_reg", platformRole: "USER", memberships: [] };

const EMPTY: PlatformMetrics = {
  mrrCents: 0,
  revenueCents: 0,
  platformFeeCents: 0,
  studios: { total: 0, active: 0, pending: 0, suspended: 0 },
  users: 0,
  artists: 0,
  orders: { total: 0, completed: 0 },
  subscriptions: { active: 0, byPlan: [] },
  aiImages: 0,
  aiByProvider: [],
  monthlyRevenueCents: [],
};

const metrics: MetricsRepository = { async getPlatformMetrics() { return EMPTY; } };

describe("admin + LGPD", () => {
  it("só admin lê métricas", async () => {
    const uc = new GetPlatformMetricsUseCase({ metrics });
    await expect(uc.execute(regular)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(uc.execute(admin)).resolves.toEqual(EMPTY);
  });

  it("export exige autenticação e retorna os dados do titular", async () => {
    const calls: string[] = [];
    const lgpd: LgpdRepository = {
      async exportUserData(id) { calls.push(id); return { user: { id } }; },
      async anonymizeUser(id) { calls.push("del:" + id); },
    };
    await expect(new ExportMyDataUseCase({ lgpd }).execute(null)).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
    const data = await new ExportMyDataUseCase({ lgpd }).execute(regular);
    expect(data).toEqual({ user: { id: "u_reg" } });
    await new DeleteMyAccountUseCase({ lgpd }).execute(regular);
    expect(calls).toEqual(["u_reg", "del:u_reg"]);
  });
});
