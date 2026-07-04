"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";

export async function reviewOrderAction(
  orderId: string,
  input: { rating: number; comment?: string },
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() =>
    useCases.reviewOrder.execute(actor, orderId, { rating: input.rating, comment: input.comment ?? null }),
  );
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}
