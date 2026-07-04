"use server";

import { getActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";

export async function exportMyDataAction(): Promise<ActionResult<Record<string, unknown>>> {
  const actor = await getActor();
  return run(() => useCases.exportMyData.execute(actor));
}

export async function deleteMyAccountAction(): Promise<ActionResult> {
  const actor = await getActor();
  return run(() => useCases.deleteMyAccount.execute(actor));
}
