"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";
import { enforceRateLimit } from "@/server/rate-limit";

export async function reviewOrderAction(
  orderId: string,
  input: { rating: number; comment?: string },
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(async () => {
    await enforceRateLimit(`review:${actor.userId}`, 5, 60_000);
    return useCases.reviewOrder.execute(actor, orderId, {
      rating: input.rating,
      comment: input.comment ?? null,
    });
  });
  if (res.ok) {
    revalidatePath(`/pedidos/${orderId}`);
    // A avaliação muda a lista de reviews e o ratingAvg do perfil cacheado.
    const artistId = res.data.artistId;
    revalidateTag(`artist-reviews:${artistId}`);
    revalidateTag(`artist:${artistId}`);
    // A nota também aparece na vitrine de descoberta.
    revalidateTag("artists-discovery");
  }
  return res.ok ? { ok: true, data: undefined } : res;
}
