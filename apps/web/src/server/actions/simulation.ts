"use server";

import { revalidatePath } from "next/cache";
import type { RequestSimulationInput, SendDesignInput, ReviewDesignInput } from "@inkvision/core";
import { getActor, requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";

export async function sendDesignAction(
  studioId: string,
  orderId: string,
  artistId: string,
  input: SendDesignInput,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() => useCases.sendDesign.execute(actor, studioId, orderId, input));
  if (res.ok) revalidatePath(`/artista/${artistId}/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function reviewDesignAction(
  orderId: string,
  input: ReviewDesignInput,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() => useCases.reviewDesign.execute(actor, orderId, input));
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function requestSimulationAction(
  orderId: string,
  input: RequestSimulationInput,
): Promise<ActionResult<{ simulationId: string }>> {
  const actor = await getActor();
  const res = await run(() => useCases.requestSimulation.execute(actor, orderId, input));
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res;
}

export async function approveSimulationAction(orderId: string): Promise<ActionResult> {
  const actor = await getActor();
  const res = await run(() => useCases.approveSimulation.execute(actor, orderId));
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}
