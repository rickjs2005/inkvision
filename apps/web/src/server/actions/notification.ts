"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/server/auth-context";
import { repositories } from "@/server/container";
import { enforceRateLimit } from "@/server/rate-limit";

export async function markNotificationsReadAction(ids?: string[]): Promise<{ ok: boolean }> {
  const actor = await getActor();
  if (!actor) return { ok: false };
  // actor garantido não-nulo aqui (checado acima).
  try {
    await enforceRateLimit(`notification:${actor.userId}`, 60, 60_000);
  } catch {
    return { ok: false };
  }
  await repositories.notifications.markRead(actor.userId, ids);
  revalidatePath("/painel");
  return { ok: true };
}
