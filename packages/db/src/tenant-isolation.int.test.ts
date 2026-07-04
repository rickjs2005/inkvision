import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma, withStudio, withUser } from "./index";

/**
 * Teste de integração do isolamento cross-tenant (Camadas 1 + 2).
 * Requer Postgres com o schema migrado + RLS aplicado (`pnpm db:setup`).
 * Rode com: `RUN_DB_TESTS=1 pnpm --filter @inkvision/db test`.
 *
 * IMPORTANTE: as checagens de RLS PURO (sem a extensão) só valem quando o app
 * conecta como role NÃO-superusuário — superusuários ignoram RLS. O `prisma dev`
 * força superusuário, então esses casos são pulados nele; em produção/Supabase
 * (role dedicado) eles rodam.
 */
const RUN = process.env.RUN_DB_TESTS === "1";
const d = RUN ? describe : describe.skip;

async function isSuperuser(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ s: boolean }[]>`
    SELECT COALESCE(rolsuper, false) OR COALESCE(rolbypassrls, false) AS s
    FROM pg_roles WHERE rolname = current_user`;
  return rows[0]?.s ?? false;
}

d("isolamento cross-tenant", () => {
  let studioA = "";
  let studioB = "";
  let clientId = "";
  let artistAId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { name: "Cliente Teste", email: `client_${Date.now()}@t.com` },
    });
    clientId = user.id;
    const a = await prisma.studio.create({ data: { slug: `a_${Date.now()}`, name: "A" } });
    const b = await prisma.studio.create({ data: { slug: `b_${Date.now()}`, name: "B" } });
    studioA = a.id;
    studioB = b.id;

    const artUser = await prisma.user.create({
      data: { name: "Artista A", email: `art_${Date.now()}@t.com` },
    });
    const art = await withStudio(studioA, (tx) =>
      tx.artistProfile.create({ data: { studioId: studioA, userId: artUser.id } }),
    );
    artistAId = art.id;

    // Um pedido pertencente ao estúdio A.
    await withStudio(studioA, (tx) =>
      tx.order.create({
        data: { studioId: studioA, clientId, artistId: artistAId, bodyPart: "braço", briefing: "x" },
      }),
    );
  });

  afterAll(async () => {
    await prisma.studio.deleteMany({ where: { id: { in: [studioA, studioB] } } });
    await prisma.user.delete({ where: { id: clientId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("estúdio A enxerga o próprio pedido", async () => {
    const orders = await withStudio(studioA, (tx) => tx.order.findMany());
    expect(orders.length).toBe(1);
  });

  it("estúdio B NÃO enxerga o pedido do A", async () => {
    const orders = await withStudio(studioB, (tx) => tx.order.findMany());
    expect(orders.length).toBe(0);
  });

  it("findFirst por id conhecido de outro tenant retorna null (findUnique reescrito)", async () => {
    const theOrder = await withStudio(studioA, (tx) => tx.order.findFirst());
    const leaked = await withStudio(studioB, (tx) =>
      tx.order.findUnique({ where: { id: theOrder!.id } }),
    );
    expect(leaked).toBeNull();
  });

  it("cliente dono enxerga o próprio pedido cross-estúdio via withUser", async () => {
    const mine = await withUser(clientId, (tx) => tx.order.findMany());
    expect(mine.length).toBe(1);
  });

  it("RLS puro: outro usuário não enxerga pedidos alheios (requer role não-superusuário)", async () => {
    if (await isSuperuser()) {
      console.warn("  ↳ pulado: conexão é superusuário (RLS ignorado). Rode com role dedicado.");
      return;
    }
    const other = await prisma.user.create({
      data: { name: "Outro", email: `other_${Date.now()}@t.com` },
    });
    // findMany SEM where explícito — depende puramente do RLS para filtrar.
    const rows = await withUser(other.id, (tx) => tx.order.findMany());
    expect(rows.length).toBe(0);
    await prisma.user.delete({ where: { id: other.id } });
  });
});
