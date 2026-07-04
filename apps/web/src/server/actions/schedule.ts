"use server";

import { revalidatePath } from "next/cache";
import type { AvailabilityRule } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";

export async function setAvailabilityAction(
  artistId: string,
  rules: AvailabilityRule[],
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() => useCases.setAvailability.execute(actor, artistId, { rules }));
  if (res.ok) revalidatePath(`/artista/${artistId}/agenda`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function addTimeOffAction(
  artistId: string,
  input: { startsAt: string; endsAt: string; reason?: string },
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() =>
    useCases.addTimeOff.execute(actor, artistId, {
      startsAt: new Date(input.startsAt),
      endsAt: new Date(input.endsAt),
      reason: input.reason ?? null,
    }),
  );
  if (res.ok) revalidatePath(`/artista/${artistId}/agenda`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function removeTimeOffAction(artistId: string, id: string): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() => useCases.removeTimeOff.execute(actor, artistId, id));
  if (res.ok) revalidatePath(`/artista/${artistId}/agenda`);
  return res;
}

export async function scheduleSessionAction(
  orderId: string,
  startsAtISO: string,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() =>
    useCases.scheduleSession.execute(actor, orderId, { startsAt: new Date(startsAtISO) }),
  );
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function rescheduleSessionAction(
  orderId: string,
  startsAtISO: string,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() =>
    useCases.rescheduleSession.execute(actor, orderId, { startsAt: new Date(startsAtISO) }),
  );
  if (res.ok) revalidatePath(`/pedidos/${orderId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}
