import { prisma } from "@inkvision/db";
import type { Actor } from "@inkvision/core";
import { useCases } from "../src/server/container";

async function main() {
  const admin = await prisma.user.findFirst({ where: { platformRole: "ADMIN" } });
  const actor: Actor = { userId: admin!.id, platformRole: "ADMIN", memberships: [] };
  const m = await useCases.getPlatformMetrics.execute(actor);
  console.log("Métricas da plataforma (leitura cross-tenant via withAdmin):");
  console.log("  MRR:", (m.mrrCents / 100).toFixed(0), "| receita:", (m.revenueCents / 100).toFixed(0), "| taxa:", (m.platformFeeCents / 100).toFixed(0));
  console.log("  estúdios:", JSON.stringify(m.studios), "| clientes:", m.users, "| tatuadores:", m.artists);
  console.log("  pedidos:", JSON.stringify(m.orders), "| imagens IA:", m.aiImages, "| IA por provider:", JSON.stringify(m.aiByProvider));
  console.log("  assinaturas:", JSON.stringify(m.subscriptions));

  const nonAdmin: Actor = { userId: "x", platformRole: "USER", memberships: [] };
  let blocked = false;
  try { await useCases.getPlatformMetrics.execute(nonAdmin); } catch { blocked = true; }
  console.log(blocked ? "  ✓ não-admin bloqueado" : "  ✗ FALHA: não-admin acessou!");
  if (m.revenueCents > 0 && m.aiImages > 0 && blocked) console.log("\n✅ Dashboard admin OK (revenue + IA + authz).");
  else console.log("\n(rode verify-flow antes para ter receita/IA nos números)");
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
