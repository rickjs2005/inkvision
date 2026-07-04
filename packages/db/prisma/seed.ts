import { PrismaClient } from "@prisma/client";
import { TATTOO_STYLES } from "@inkvision/shared";

const prisma = new PrismaClient();

async function main() {
  // ── Estilos (9 categorias) ──
  for (const s of TATTOO_STYLES) {
    await prisma.style.upsert({
      where: { slug: s.slug },
      update: { name: s.name },
      create: { slug: s.slug, name: s.name },
    });
  }
  console.log(`✓ ${TATTOO_STYLES.length} estilos`);

  // ── Planos SaaS ──
  const plans = [
    {
      slug: "starter",
      name: "Starter",
      priceCents: 9900,
      maxArtists: 2,
      aiCreditsMonthly: 50,
      features: { chat: true, portfolio: true, payments: true },
    },
    {
      slug: "pro",
      name: "Pro",
      priceCents: 24900,
      maxArtists: 8,
      aiCreditsMonthly: 300,
      features: { chat: true, portfolio: true, payments: true, analytics: true },
    },
    {
      slug: "enterprise",
      name: "Enterprise",
      priceCents: 59900,
      maxArtists: 100,
      aiCreditsMonthly: 2000,
      features: { chat: true, portfolio: true, payments: true, analytics: true, priority: true },
    },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      update: { name: p.name, priceCents: p.priceCents, maxArtists: p.maxArtists, aiCreditsMonthly: p.aiCreditsMonthly, features: p.features },
      create: p,
    });
  }
  console.log(`✓ ${plans.length} planos`);

  // ── Admin da plataforma (idempotente) ──
  await prisma.user.upsert({
    where: { email: "admin@inkvision.app" },
    update: { platformRole: "ADMIN" },
    create: {
      name: "Admin InkVision",
      email: "admin@inkvision.app",
      emailVerified: true,
      platformRole: "ADMIN",
    },
  });
  console.log("✓ admin@inkvision.app (defina a senha via fluxo de auth)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
