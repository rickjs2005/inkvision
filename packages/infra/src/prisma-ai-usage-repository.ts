import { withStudio } from "@inkvision/db";
import type { AiUsageRepository } from "@inkvision/core";

/** AiUsageLog é studio-scoped (RLS studio-only) — grava via withStudio. */
export class PrismaAiUsageRepository implements AiUsageRepository {
  async log(input: {
    studioId: string;
    provider: string;
    operation: string;
    costCents?: number;
  }): Promise<void> {
    await withStudio(input.studioId, (tx) =>
      tx.aiUsageLog.create({
        data: {
          studioId: input.studioId,
          provider: input.provider,
          operation: input.operation,
          costCents: input.costCents ?? null,
        },
      }),
    );
  }
}
