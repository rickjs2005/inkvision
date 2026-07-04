/**
 * Verificação end-to-end do fluxo completo contra o banco real, usando os
 * use-cases reais (mesma composição do app). Dirige o pedido de demo do
 * orçamento até a avaliação e confere cada transição.
 *
 * Rode com o DATABASE_URL do dev apontado:
 *   node --import tsx apps/web/scripts/verify-flow.ts
 */
import { prisma } from "@inkvision/db";
import type { Actor } from "@inkvision/core";
import { useCases } from "../src/server/container";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error("✗ " + msg);
  console.log("  ✓ " + msg);
}

async function statusOf(orderId: string) {
  const o = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  return o!.status;
}

async function main() {
  const studio = await prisma.studio.findUnique({ where: { slug: "alma" } });
  const rafa = await prisma.user.findUnique({ where: { email: "rafa@inkvision.app" } });
  const cliente = await prisma.user.findUnique({ where: { email: "cliente@inkvision.app" } });
  const artist = await prisma.artistProfile.findFirst({ where: { userId: rafa!.id } });
  const order = await prisma.order.findFirst({ where: { clientId: cliente!.id }, orderBy: { createdAt: "desc" } });
  if (!studio || !artist || !order) throw new Error("Rode o seed de demo antes.");

  const studioId = studio.id;
  const orderId = order.id;
  const artistActor: Actor = { userId: rafa!.id, platformRole: "USER", memberships: [{ studioId, role: "ARTIST" }] };
  const clientActor: Actor = { userId: cliente!.id, platformRole: "USER", memberships: [] };

  console.log("Dirigindo o pedido", orderId, "pelo fluxo completo:\n");

  // Reset para SUBMITTED (idempotência do teste).
  await prisma.order.update({ where: { id: orderId }, data: { status: "SUBMITTED" } });

  await useCases.sendQuote.execute(artistActor, studioId, orderId, { quoteAmount: 900, depositAmount: 300 });
  assert((await statusOf(orderId)) === "QUOTED", "orçamento enviado → QUOTED");

  await useCases.acceptQuote.execute(clientActor, orderId);
  assert((await statusOf(orderId)) === "DEPOSIT_PENDING", "cliente aceitou → DEPOSIT_PENDING");

  await useCases.startOrderPayment.execute(clientActor, orderId, "DEPOSIT");
  await useCases.confirmOrderPayment.execute(clientActor, orderId, "DEPOSIT");
  assert((await statusOf(orderId)) === "DEPOSIT_PAID", "sinal pago → DEPOSIT_PAID");

  await useCases.sendDesign.execute(artistActor, studioId, orderId, { imageUrl: "https://cdn/art.png" });
  assert((await statusOf(orderId)) === "DESIGN_REVIEW", "arte enviada → DESIGN_REVIEW");

  await useCases.reviewDesign.execute(clientActor, orderId, { approve: true });
  assert((await statusOf(orderId)) === "DESIGN_APPROVED", "arte aprovada → DESIGN_APPROVED");

  const { simulationId } = await useCases.requestSimulation.execute(clientActor, orderId, {
    bodyPhotoUrl: "https://cdn/body.jpg",
    placement: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
  });
  assert((await statusOf(orderId)) === "SIMULATING", "foto enviada → SIMULATING");

  await useCases.processSimulation.execute(simulationId);
  assert((await statusOf(orderId)) === "SIMULATION_REVIEW", "IA processou → SIMULATION_REVIEW");

  await useCases.approveSimulation.execute(clientActor, orderId);
  assert((await statusOf(orderId)) === "SIMULATION_APPROVED", "simulação aprovada → SIMULATION_APPROVED");

  const slots = await useCases.getOrderSlots.execute(clientActor, orderId);
  assert(slots.length > 0, `${slots.length} horários disponíveis gerados`);

  await useCases.scheduleSession.execute(clientActor, orderId, { startsAt: slots[0]!.startsAt });
  assert((await statusOf(orderId)) === "SCHEDULED", "sessão agendada → SCHEDULED");

  await useCases.startOrderPayment.execute(clientActor, orderId, "FINAL");
  await useCases.confirmOrderPayment.execute(clientActor, orderId, "FINAL");
  assert((await statusOf(orderId)) === "COMPLETED", "pagamento final → COMPLETED");

  await useCases.reviewOrder.execute(clientActor, orderId, { rating: 5, comment: "Experiência incrível!" });
  assert((await statusOf(orderId)) === "REVIEWED", "avaliação enviada → REVIEWED");

  const updatedArtist = await prisma.artistProfile.findUnique({ where: { id: artist.id }, select: { ratingCount: true } });
  assert((updatedArtist!.ratingCount ?? 0) >= 1, "nota do tatuador recalculada");

  console.log("\n✅ FLUXO COMPLETO verificado contra o banco real: cadastro → avaliação.\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
