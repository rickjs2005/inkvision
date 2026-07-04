import { Prisma } from "@prisma/client";

/**
 * Camada 1 do isolamento multi-tenant (ver docs/ARCHITECTURE.md §1.2).
 *
 * Injeta `studioId` em toda operação sobre modelos tenant-scoped:
 *  - leituras (findMany/findFirst/count/aggregate/groupBy) ganham `where.studioId`;
 *  - escritas (create/createMany) recebem `data.studioId`;
 *  - update/delete/upsert são restringidos ao tenant;
 *  - findUnique é reescrito para findFirst para poder somar o filtro de tenant.
 *
 * Defesa em profundidade: RLS no Postgres (Camada 2) cobre qualquer caminho que
 * escape desta extensão. Nunca dependa apenas desta camada.
 */

/** Modelos que carregam `studioId` e devem ser isolados por tenant. */
export const TENANT_MODELS = new Set<string>([
  "StudioMember",
  "ArtistProfile",
  "PortfolioItem",
  "Order",
  "Conversation",
  "Appointment",
  "Payment",
  "Review",
  "AiUsageLog",
]);

const READ_OPS = new Set(["findFirst", "findFirstOrThrow", "findMany", "count", "aggregate", "groupBy"]);
const WRITE_MANY_OPS = new Set(["updateMany", "deleteMany"]);
const WHERE_SINGLE_OPS = new Set(["update", "delete", "upsert"]);

export interface ScopeResult {
  operation: string;
  args: Record<string, unknown>;
}

/**
 * Função pura que aplica o escopo de tenant a (model, operation, args).
 * Retorna a operação (possivelmente reescrita) e os args transformados.
 * Testável sem banco.
 */
export function scopeArgs(
  model: string | undefined,
  operation: string,
  rawArgs: unknown,
  studioId: string,
): ScopeResult {
  const args = { ...((rawArgs as Record<string, unknown>) ?? {}) };
  if (!model || !TENANT_MODELS.has(model)) return { operation, args };

  if (READ_OPS.has(operation) || WRITE_MANY_OPS.has(operation)) {
    args.where = { ...(args.where as object), studioId };
    return { operation, args };
  }

  if (operation === "findUnique" || operation === "findUniqueOrThrow") {
    // Prisma 4.5+ aceita campos não-únicos no where do findUnique como filtro
    // adicional — não precisamos reescrever a operação (evita re-invocação
    // frágil de `query`, incompatível com alguns proxies).
    args.where = { ...(args.where as object), studioId };
    return { operation, args };
  }

  if (operation === "create") {
    args.data = { ...(args.data as object), studioId };
    return { operation, args };
  }

  if (operation === "createMany") {
    const data = args.data;
    args.data = Array.isArray(data)
      ? data.map((d) => ({ ...(d as object), studioId }))
      : { ...(data as object), studioId };
    return { operation, args };
  }

  if (WHERE_SINGLE_OPS.has(operation)) {
    args.where = { ...(args.where as object), studioId };
    if (operation === "upsert") args.create = { ...(args.create as object), studioId };
    return { operation, args };
  }

  return { operation, args };
}

export function tenantExtension(studioId: string) {
  if (!studioId) throw new Error("tenantExtension requer um studioId não-vazio.");

  return Prisma.defineExtension({
    name: "multi-tenant",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const scoped = scopeArgs(model, operation, args, studioId);
          return query(scoped.args);
        },
      },
    },
  });
}
