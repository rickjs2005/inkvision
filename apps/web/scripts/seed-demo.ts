/**
 * Seed de demonstração — popula a plataforma com contas de teste, um estúdio
 * ativo, tatuadores, portfólio e um pedido de exemplo, para dar pra testar tudo
 * imediatamente. Idempotente (limpa e recria os dados de demo).
 *
 * Rode: pnpm --filter @inkvision/web seed:demo   (com o DATABASE_URL apontando
 * para o banco de dev; ver TESTING.md).
 */
import { hashPassword } from "better-auth/crypto";
import { prisma } from "@inkvision/db";
import { TATTOO_STYLES } from "@inkvision/shared";
import { MockStorageService } from "@inkvision/infra";

const PASSWORD = "inkvision123";
const storage = new MockStorageService();

async function photo(seed: string) {
  const t = await storage.createUploadUrl({
    purpose: "portfolio",
    filename: `${seed}.jpg`,
    contentType: "image/jpeg",
    sizeBytes: 1,
  });
  return t.publicUrl;
}

async function createUser(email: string, name: string, admin = false) {
  const hash = await hashPassword(PASSWORD);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, platformRole: admin ? "ADMIN" : "USER" },
    create: { email, name, emailVerified: true, platformRole: admin ? "ADMIN" : "USER" },
  });
  await prisma.account.upsert({
    where: { providerId_accountId: { providerId: "credential", accountId: user.id } },
    update: { password: hash },
    create: { userId: user.id, accountId: user.id, providerId: "credential", password: hash },
  });
  return user;
}

async function main() {
  // Estilos + planos (garante base).
  for (const s of TATTOO_STYLES) {
    await prisma.style.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }
  const plans = [
    { slug: "starter", name: "Starter", priceCents: 9900, maxArtists: 2, aiCreditsMonthly: 50, features: {} },
    { slug: "pro", name: "Pro", priceCents: 24900, maxArtists: 8, aiCreditsMonthly: 300, features: {} },
    { slug: "enterprise", name: "Enterprise", priceCents: 59900, maxArtists: 100, aiCreditsMonthly: 2000, features: {} },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  const styles = await prisma.style.findMany();
  const styleId = (slug: string) => styles.find((s) => s.slug === slug)!.id;
  const proPlan = await prisma.plan.findUnique({ where: { slug: "pro" } });

  // Contas.
  const admin = await createUser("admin@inkvision.app", "Admin InkVision", true);
  const owner = await createUser("alma@inkvision.app", "Alma (Dona)");
  const rafa = await createUser("rafa@inkvision.app", "Rafa Costa");
  const bia = await createUser("bia@inkvision.app", "Bia Nunes");
  const client = await createUser("cliente@inkvision.app", "Cliente Teste");
  void admin;

  // Estúdio ativo (limpa demo anterior pelo slug).
  await prisma.studio.deleteMany({ where: { slug: "alma" } });
  const studio = await prisma.studio.create({
    data: {
      slug: "alma",
      name: "Estúdio Alma",
      status: "ACTIVE",
      description: "Blackwork, fine line e realismo em Belo Horizonte. Arte autoral e atendimento acolhedor.",
      addressCity: "Belo Horizonte",
      addressState: "MG",
      phone: "(31) 99999-0000",
      stripeAccountId: "acct_mock_demo",
      socials: { instagram: "estudioalma" },
      members: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: rafa.id, role: "ARTIST" },
          { userId: bia.id, role: "ARTIST" },
        ],
      },
    },
  });

  if (proPlan) {
    await prisma.subscription.upsert({
      where: { studioId: studio.id },
      update: { planId: proPlan.id, status: "active", currentPeriodEnd: new Date(Date.now() + 30 * 864e5), stripeSubscriptionId: "sub_mock_demo" },
      create: { studioId: studio.id, planId: proPlan.id, status: "active", stripeSubscriptionId: "sub_mock_demo", currentPeriodEnd: new Date(Date.now() + 30 * 864e5) },
    });
  }

  // Perfis de tatuador + portfólio.
  const rafaArtist = await prisma.artistProfile.create({
    data: {
      studioId: studio.id,
      userId: rafa.id,
      bio: "8 anos de blackwork e fine line. Fecho braços e crio peças autorais.",
      experienceYears: 8,
      instagram: "rafacosta.ink",
      avgPriceCents: 90000,
      ratingAvg: 4.9,
      ratingCount: 127,
      styles: { create: [{ styleId: styleId("blackwork") }, { styleId: styleId("fine-line") }] },
    },
  });
  const biaArtist = await prisma.artistProfile.create({
    data: {
      studioId: studio.id,
      userId: bia.id,
      bio: "Realismo e aquarela. Amo cor e retratos.",
      experienceYears: 5,
      instagram: "bia.nunes.tattoo",
      avgPriceCents: 70000,
      ratingAvg: 4.8,
      ratingCount: 64,
      styles: { create: [{ styleId: styleId("realismo") }, { styleId: styleId("aquarela") }] },
    },
  });

  // Disponibilidade (seg–sex, 10h–18h UTC) para os dois tatuadores.
  for (const a of [rafaArtist, biaArtist]) {
    await prisma.availabilityRule.deleteMany({ where: { artistId: a.id } });
    await prisma.availabilityRule.createMany({
      data: [1, 2, 3, 4, 5].map((weekday) => ({ artistId: a.id, weekday, startMin: 600, endMin: 1080 })),
    });
  }

  for (const [i, a] of [rafaArtist, biaArtist].entries()) {
    for (let j = 0; j < 4; j++) {
      await prisma.portfolioItem.create({
        data: {
          studioId: studio.id,
          artistId: a.id,
          type: "IMAGE",
          mediaUrl: await photo(`a${i}-${j}`),
          description: j === 0 ? "Peça autoral" : null,
          tags: i === 0 ? ["blackwork", "braço"] : ["realismo", "cor"],
          styleId: i === 0 ? styleId("blackwork") : styleId("realismo"),
        },
      });
    }
  }

  // Histórico de simulações de IA — alimenta a prova social pública
  // (hero/diretórios mostram a contagem real de AiUsageLog).
  await prisma.aiUsageLog.createMany({
    data: Array.from({ length: 38 }, (_, i) => ({
      studioId: studio.id,
      provider: "mock",
      operation: "simulate",
      createdAt: new Date(Date.now() - i * 7 * 36e5),
    })),
  });

  // Pedido de exemplo (cliente → Rafa), aguardando orçamento.
  await prisma.order.deleteMany({ where: { clientId: client.id } });
  await prisma.order.create({
    data: {
      studioId: studio.id,
      clientId: client.id,
      artistId: rafaArtist.id,
      styleId: styleId("fine-line"),
      bodyPart: "Antebraço direito",
      approxSizeCm: 12,
      briefing: "Quero um leão em fine line no antebraço, estilo minimalista, com poucas linhas.",
      status: "SUBMITTED",
      events: { create: { to: "SUBMITTED", actorId: client.id } },
    },
  });

  console.log("\n✓ Seed de demo aplicado.\n");
  console.log("Contas (senha: " + PASSWORD + "):");
  console.log("  admin@inkvision.app     → admin da plataforma");
  console.log("  alma@inkvision.app      → dona do Estúdio Alma");
  console.log("  rafa@inkvision.app      → tatuador (tem 1 pedido novo)");
  console.log("  bia@inkvision.app       → tatuador");
  console.log("  cliente@inkvision.app   → cliente (tem 1 pedido enviado)");
  console.log("\nEstúdio público: /s/alma   ·   Tatuadores: /tatuadores\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
