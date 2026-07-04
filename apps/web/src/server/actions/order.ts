"use server";

import { revalidatePath } from "next/cache";
import type { CreateOrderInput } from "@inkvision/core";
import { getActor, requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<ActionResult<{ orderId: string }>> {
  const actor = await getActor();
  const res = await run(async () => {
    const order = await useCases.createOrder.execute(actor, input);
    return { orderId: order.id };
  });
  if (res.ok) revalidatePath("/pedidos");
  return res;
}

export async function sendQuoteAction(
  studioId: string,
  orderId: string,
  artistId: string,
  input: { quoteAmount: number; depositAmount: number },
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() => useCases.sendQuote.execute(actor, studioId, orderId, input));
  if (res.ok) revalidatePath(`/artista/${artistId}/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function acceptQuoteAction(orderId: string): Promise<ActionResult> {
  const actor = await getActor();
  const res = await run(() => useCases.acceptQuote.execute(actor, orderId));
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  const actor = await getActor();
  const res = await run(() => useCases.cancelOrder.execute(actor, orderId));
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}
