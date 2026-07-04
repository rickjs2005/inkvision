"use server";

import type { SendMessageInput, ChatMessage } from "@inkvision/core";
import { RT } from "@inkvision/shared";
import { getActor, requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";
import { emitToConversation } from "@/server/realtime";
import { enforceRateLimit } from "@/server/rate-limit";

export async function sendClientMessageAction(
  orderId: string,
  input: SendMessageInput,
): Promise<ActionResult<ChatMessage>> {
  const actor = await getActor();
  return run(async () => {
    // actor pode ser null (getActor); o caso de uso barra por auth.
    if (actor) await enforceRateLimit(`chat:${actor.userId}`, 30, 60_000);
    const { message, conversationId } = await useCases.sendClientMessage.execute(actor, orderId, input);
    await emitToConversation(conversationId, RT.MESSAGE_NEW, message);
    return message;
  });
}

export async function sendStudioMessageAction(
  studioId: string,
  orderId: string,
  input: SendMessageInput,
): Promise<ActionResult<ChatMessage>> {
  const actor = await requireActor();
  return run(async () => {
    await enforceRateLimit(`chat:${actor.userId}`, 30, 60_000);
    const { message, conversationId } = await useCases.sendStudioMessage.execute(
      actor,
      studioId,
      orderId,
      input,
    );
    await emitToConversation(conversationId, RT.MESSAGE_NEW, message);
    return message;
  });
}

export async function markReadClientAction(orderId: string): Promise<{ ok: boolean }> {
  const actor = await getActor();
  if (!actor) return { ok: false };
  await useCases.markReadClient.execute(actor, orderId).catch(() => 0);
  return { ok: true };
}

export async function markReadStudioAction(studioId: string, orderId: string): Promise<{ ok: boolean }> {
  const actor = await getActor();
  if (!actor) return { ok: false };
  await useCases.markReadStudio.execute(actor, studioId, orderId).catch(() => 0);
  return { ok: true };
}
