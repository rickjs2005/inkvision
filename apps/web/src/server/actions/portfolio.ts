"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { CreatePortfolioItemInput, UpdatePortfolioItemInput } from "@inkvision/core";
import { getActor, requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { repositories, useCases } from "@/server/container";
import { enforceRateLimit } from "@/server/rate-limit";

export async function createPortfolioItemAction(
  artistId: string,
  input: CreatePortfolioItemInput,
): Promise<ActionResult<{ id: string }>> {
  const actor = await requireActor();
  let studioId: string | undefined;
  const res = await run(async () => {
    const item = await useCases.createPortfolioItem.execute(actor, artistId, input);
    studioId = item.studioId;
    return { id: item.id };
  });
  if (res.ok) {
    revalidatePath(`/artista/${artistId}`);
    revalidatePath(`/t/${artistId}`);
    revalidateTag(`artist:${artistId}`);
    // A galeria pública do estúdio (/s/[slug]) mostra as peças recentes — precisa
    // ser invalidada junto quando uma peça nova entra no portfólio.
    if (studioId) revalidateTag(`studio-portfolio:${studioId}`);
    revalidateTag("artists-discovery");
  }
  return res;
}

export async function updatePortfolioItemAction(
  itemId: string,
  artistId: string,
  input: UpdatePortfolioItemInput,
): Promise<ActionResult> {
  const actor = await requireActor();
  let studioId: string | undefined;
  const res = await run(async () => {
    const item = await useCases.updatePortfolioItem.execute(actor, itemId, input);
    studioId = item.studioId;
    return item;
  });
  if (res.ok) {
    revalidatePath(`/artista/${artistId}`);
    revalidateTag(`artist:${artistId}`);
    if (studioId) revalidateTag(`studio-portfolio:${studioId}`);
  }
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
    revalidateTag(`artist:${artistId}`);
    revalidateTag("artists-discovery");
    // A peça já foi removida — busca o estúdio pelo artista pra invalidar a
    // galeria pública, já que o caso de uso não retorna o item apagado.
    const artist = await repositories.artists.findById(artistId);
    if (artist) revalidateTag(`studio-portfolio:${artist.studioId}`);
  }
  return res;
}

export async function toggleLikeAction(
  itemId: string,
): Promise<ActionResult<{ liked: boolean; likesCount: number }>> {
  const actor = await getActor();
  return run(async () => {
    // actor pode ser null (getActor); o caso de uso barra por auth.
    if (actor) await enforceRateLimit(`engage:${actor.userId}`, 60, 60_000);
    return useCases.toggleLike.execute(actor, itemId);
  });
}

export async function addCommentAction(
  itemId: string,
  body: string,
): Promise<ActionResult<{ id: string; authorName: string; body: string }>> {
  const actor = await getActor();
  return run(async () => {
    // actor pode ser null (getActor); o caso de uso barra por auth.
    if (actor) await enforceRateLimit(`engage:${actor.userId}`, 60, 60_000);
    const c = await useCases.addComment.execute(actor, itemId, { body });
    return { id: c.id, authorName: c.authorName, body: c.body };
  });
}

export async function getCommentsAction(itemId: string) {
  const comments = await useCases.listComments.execute(itemId);
  return comments.map((c) => ({ id: c.id, authorName: c.authorName, body: c.body }));
}

/**
 * Estado do VIEWER sobre o portfólio de um artista (sessão + likes). A página
 * pública /t/{id} é estática (ISR); o que depende de quem olha é hidratado no
 * cliente por esta action.
 */
export async function getViewerPortfolioStateAction(
  artistId: string,
): Promise<{ isAuthed: boolean; likedIds: string[] }> {
  const actor = await getActor();
  if (!actor) return { isAuthed: false, likedIds: [] };
  const items = await useCases.listPortfolio.execute(artistId, actor.userId);
  return {
    isAuthed: true,
    likedIds: items.filter((i) => i.likedByViewer).map((i) => i.id),
  };
}
