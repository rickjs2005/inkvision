"use server";

import { revalidatePath } from "next/cache";
import type { PaymentKind } from "@inkvision/core";
import { getActor, requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";
import { enforceRateLimit } from "@/server/rate-limit";

/**
 * Inicia (ou retoma) o onboarding da conta de recebimento e devolve a URL do
 * provedor para redirecionar o dono. O retorno volta para a página de planos.
 */
export async function connectPaymentsAction(
  studioId: string,
): Promise<ActionResult<{ url: string }>> {
  const actor = await requireActor();
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const planos = `${base}/estudio/${studioId}/planos`;
  const res = await run(async () => {
    await enforceRateLimit(`payment:${actor.userId}`, 10, 60_000);
    return useCases.connectStudioPayments.execute(actor, studioId, {
      refreshUrl: `${planos}?connect=refresh`,
      returnUrl: `${planos}?connect=retorno`,
    });
  });
  if (res.ok) revalidatePath(`/estudio/${studioId}/planos`);
  return res;
}

export async function startOrderPaymentAction(
  orderId: string,
  kind: PaymentKind,
): Promise<ActionResult<{ url: string }>> {
  const actor = await getActor();
  return run(async () => {
    // actor pode ser null (getActor); o caso de uso barra por auth.
    if (actor) await enforceRateLimit(`payment:${actor.userId}`, 10, 60_000);
    return useCases.startOrderPayment.execute(actor, orderId, kind);
  });
}

export async function confirmOrderPaymentAction(
  orderId: string,
  kind: PaymentKind,
): Promise<ActionResult> {
  const actor = await getActor();
  const res = await run(async () => {
    // actor pode ser null (getActor); o caso de uso barra por auth.
    if (actor) await enforceRateLimit(`payment:${actor.userId}`, 10, 60_000);
    return useCases.confirmOrderPayment.execute(actor, orderId, kind);
  });
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function subscribeStudioAction(
  studioId: string,
  planSlug: string,
): Promise<ActionResult<{ url: string }>> {
  const actor = await requireActor();
  return run(async () => {
    await enforceRateLimit(`payment:${actor.userId}`, 10, 60_000);
    return useCases.subscribeStudio.execute(actor, studioId, planSlug);
  });
}

export async function confirmSubscriptionAction(
  studioId: string,
  planSlug: string,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(async () => {
    await enforceRateLimit(`payment:${actor.userId}`, 10, 60_000);
    return useCases.confirmSubscription.execute(actor, studioId, planSlug);
  });
  if (res.ok) revalidatePath("/painel");
  return res.ok ? { ok: true, data: undefined } : res;
}
