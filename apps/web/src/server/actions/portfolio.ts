"use server";

import { revalidatePath } from "next/cache";
import type { CreatePortfolioItemInput, UpdatePortfolioItemInput } from "@inkvision/core";
import { getActor, requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";

export async function createPortfolioItemAction(
  artistId: string,
  input: CreatePortfolioItemInput,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  const res = await run(async () => {
    const item = await useCases.createPortfolioItem.execute(actor, artistId, input);
    return { id: item.id };
  });
  if (res.ok) {
    revalidatePath(`/artista/${artistId}`);
    revalidatePath(`/t/${artistId}`);
  }
  return res;
}

export async function updatePortfolioItemAction(
  itemId: string,
  artistId: string,
  input: UpdatePortfolioItemInput,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() => useCases.updatePortfolioItem.execute(actor, itemId, input));
  if (res.ok) revalidatePath(`/artista/${artistId}`);
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function deletePortfolioItemAction(
  itemId: string,
  artistId: string,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() => useCases.deletePortfolioItem.execute(actor, itemId));
  if (res.ok) {
    revalidatePath(`/artista/${artistId}`);
    revalidatePath(`/t/${artistId}`);
  }
  return res;
}

export async function toggleLikeAction(
  itemId: string,
): Promise<ActionResult<{ liked: boolean; likesCount: number }>> {
  const actor = await getActor();
  return run(() => useCases.toggleLike.execute(actor, itemId));
}

export async function addCommentAction(
  itemId: string,
  body: string,
): Promise<ActionResult<{ id: string; authorName: string; body: string }>> {
  const actor = await getActor();
  return run(async () => {
    const c = await useCases.addComment.execute(actor, itemId, { body });
    return { id: c.id, authorName: c.authorName, body: c.body };
  });
}

export async function getCommentsAction(itemId: string) {
  const comments = await useCases.listComments.execute(itemId);
  return comments.map((c) => ({ id: c.id, authorName: c.authorName, body: c.body }));
}
