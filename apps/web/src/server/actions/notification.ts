"use server";

import { revalidatePath } from "next/cache";
import { getActor } from "@/server/auth-context";
import { repositories } from "@/server/container";

export async function markNotificationsReadAction(ids?: string[]): Promise<{ ok: boolean }> {
  const actor = await getActor();
  if (!actor) return { ok: false };
  await repositories.notifications.markRead(actor.userId, ids);
  revalidatePath("/painel");
  return { ok: true };
}
