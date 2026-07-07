"use server";

import { getActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";
import { enforceRateLimit } from "@/server/rate-limit";

export async function exportMyDataAction(): Promise<ActionResult<Record<string, unknown>>> {
  const actor = await getActor();
  return run(async () => {
    // actor pode ser null (getActor); o caso de uso barra por auth.
    if (actor) await enforceRateLimit(`account:${actor.userId}`, 5, 300_000);
    return useCases.exportMyData.execute(actor);
  });
}

export async function deleteMyAccountAction(): Promise<ActionResult> {
  const actor = await getActor();
  return run(async () => {
    // actor pode ser null (getActor); o caso de uso barra por auth.
    if (actor) await enforceRateLimit(`account:${actor.userId}`, 5, 300_000);
    return useCases.deleteMyAccount.execute(actor);
  });
}
