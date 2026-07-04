import { Prisma, PrismaClient } from "@prisma/client";
import { tenantExtension } from "./tenant-extension";

export * from "@prisma/client";
export { tenantExtension } from "./tenant-extension";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Cliente base (sem escopo de tenant). Use apenas em contexto de plataforma/admin. */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Guard de boot: garante que o app NÃO está conectado como superusuário nem como
 * um role com BYPASSRLS. Se estiver, o RLS é silenciosamente ignorado pelo
 * Postgres e há vazamento cross-tenant. Em produção isso é fatal (throw); fora
 * de produção apenas avisa, para não travar o dev que usa o role local.
 *
 * Não é chamada aqui de propósito — o boot da aplicação deve invocá-la.
 */
export async function assertAppRoleSafe(): Promise<void> {
  const rows = await prisma.$queryRaw<{ unsafe: boolean }[]>`
    SELECT COALESCE(rolsuper, false) OR COALESCE(rolbypassrls, false) AS unsafe
    FROM pg_roles
    WHERE rolname = current_user
  `;
  const unsafe = rows[0]?.unsafe === true;
  if (!unsafe) return;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SEGURANÇA: o app está conectado como superusuário/BYPASSRLS — o RLS não vale. Configure um role dedicado (inkvision_app).",
    );
  }
  console.warn(
    "[assertAppRoleSafe] AVISO: conectado como superusuário/BYPASSRLS — o RLS está sendo ignorado. Use um role dedicado (inkvision_app) antes de ir para produção.",
  );
}

/**
 * Cliente com escopo de tenant (Camada 1 — extensão que injeta studioId).
 * Não ativa RLS por si só; para a defesa completa use `withStudio`.
 */
export function forStudio(studioId: string) {
  return prisma.$extends(tenantExtension(studioId));
}

/** Cliente estendido com escopo de tenant (retorno de `forStudio`). */
export type StudioClient = ReturnType<typeof forStudio>;
/** Cliente de transação com escopo de tenant (parâmetro de `withStudio`). */
export type TenantTx = Parameters<Parameters<StudioClient["$transaction"]>[0]>[0];

/**
 * Executa `fn` dentro de uma transação isolada por tenant.
 *  - Camada 1: a query extension injeta `studioId` em toda operação.
 *  - Camada 2: `set_config('app.current_studio_id', …, is_local=true)` ativa as
 *    políticas RLS para a mesma conexão/transação (equivalente a SET LOCAL).
 *
 * As extensões de query são preservadas no cliente de transação, então `tx`
 * dentro do callback já vem com o filtro de tenant aplicado.
 */
export async function withStudio<T>(
  studioId: string,
  fn: (tx: TenantTx) => Promise<T>,
): Promise<T> {
  if (!studioId) throw new Error("withStudio requer um studioId não-vazio.");
  const client = forStudio(studioId);
  return client.$transaction(async (tx) => {
    // Define o tenant e ZERA o contexto de usuário — evita que um GUC vazado de
    // uma transação anterior (pooler em modo transação, ex.: PgBouncer/Supabase)
    // conceda acesso indevido. Parametrizado — nunca interpola id no SQL.
    await tx.$executeRaw`SELECT set_config('app.current_studio_id', ${studioId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_user_id', '', true)`;
    return fn(tx);
  });
}

/**
 * Executa `fn` no contexto do usuário dono (cliente). Ativa as políticas RLS que
 * liberam linhas onde `clientId = app.current_user_id` — permite ao cliente ler
 * os próprios pedidos/conversas/pagamentos cross-estúdio, sem escopo de tenant.
 * NÃO aplica a extensão de tenant (não é uma leitura tenant-scoped); o filtro por
 * clientId deve ser explícito na query (defesa em profundidade).
 */
export async function withUser<T>(
  userId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  if (!userId) throw new Error("withUser requer um userId não-vazio.");
  return prisma.$transaction(async (tx) => {
    // Define o usuário e ZERA o contexto de tenant (ver nota em withStudio).
    await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
    await tx.$executeRaw`SELECT set_config('app.current_studio_id', '', true)`;
    return fn(tx);
  });
}

/**
 * Contexto de ADMIN da plataforma: ativa o bypass do RLS (leitura cross-tenant
 * para métricas/auditoria). SÓ deve ser usado após o caso de uso confirmar que
 * o actor é ADMIN — nunca com dado do cliente. Marca `app.is_admin = true`, que
 * as políticas RLS honram apenas na leitura.
 */
export async function withAdmin<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.is_admin', 'true', true)`;
    return fn(tx);
  });
}
