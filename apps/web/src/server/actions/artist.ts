"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireActor } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";

export async function addArtistAction(
  studioId: string,
  _prev: ActionResult<{ artistId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ artistId: string }>> {
  const actor = await requireActor();
  const res = await run(async () => {
    const artist = await useCases.addArtist.execute(actor, studioId, {
      email: String(formData.get("email") ?? ""),
    });
    return { artistId: artist.id };
  });
  if (res.ok) revalidatePath(`/estudio/${studioId}/tatuadores`);
  return res;
}

export async function updateArtistAction(
  artistId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() =>
    useCases.updateArtist.execute(actor, artistId, {
      bio: (formData.get("bio") as string) || null,
      experienceYears: formData.get("experienceYears")
        ? Number(formData.get("experienceYears"))
        : null,
      instagram: (formData.get("instagram") as string) || null,
      avgPriceCents: formData.get("avgPrice")
        ? Math.round(Number(formData.get("avgPrice")) * 100)
        : null,
      isActive: formData.get("isActive") === "on",
    }),
  );
  if (res.ok) {
    revalidatePath(`/artista/${artistId}`);
    revalidateTag(`artist:${artistId}`);
    revalidateTag("artists-discovery");
  }
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function setArtistStylesAction(
  artistId: string,
  styleIds: string[],
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() => useCases.setArtistStyles.execute(actor, artistId, { styleIds }));
  if (res.ok) {
    revalidatePath(`/artista/${artistId}`);
    revalidateTag(`artist:${artistId}`);
    revalidateTag("artists-discovery");
  }
  return res.ok ? { ok: true, data: undefined } : res;
}
