"use server";

import { revalidatePath } from "next/cache";
import type { StudioStatus } from "@inkvision/core";
import { getActor, requireActor, requirePlatformAdmin } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";

export async function createStudioAction(
  _prev: ActionResult<{ slug: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ slug: string }>> {
  const actor = await requirePlatformAdmin();
  return run(async () => {
    const studio = await useCases.createStudio.execute(actor, {
      name: String(formData.get("name") ?? ""),
      slug: (formData.get("slug") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      ownerEmail: String(formData.get("ownerEmail") ?? ""),
    });
    revalidatePath("/admin/estudios");
    return { slug: studio.slug };
  });
}

export async function setStudioStatusAction(
  studioId: string,
  status: StudioStatus,
): Promise<ActionResult> {
  const actor = await requirePlatformAdmin();
  const res = await run(() => useCases.setStudioStatus.execute(actor, studioId, status));
  if (res.ok) revalidatePath("/admin/estudios");
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function removeStudioAction(studioId: string): Promise<ActionResult> {
  const actor = await requirePlatformAdmin();
  const res = await run(() => useCases.removeStudio.execute(actor, studioId));
  if (res.ok) revalidatePath("/admin/estudios");
  return res;
}

export async function completeOnboardingAction(
  studioId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(() =>
    useCases.completeOnboarding.execute(actor, studioId, {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      description: (formData.get("description") as string) || undefined,
      address: {
        street: (formData.get("street") as string) || undefined,
        city: (formData.get("city") as string) || undefined,
        state: (formData.get("state") as string) || undefined,
        zip: (formData.get("zip") as string) || undefined,
      },
    }),
  );
  if (res.ok) revalidatePath("/estudio");
  return res.ok ? { ok: true, data: undefined } : res;
}

/** Usado por Server Components para listar (não é action de mutação). */
export async function listStudios(input: {
  status?: StudioStatus;
  query?: string;
  page?: number;
}) {
  const actor = await getActor();
  if (!actor) return { items: [], total: 0, page: 1, perPage: 20 };
  return useCases.listStudios.execute(actor, {
    status: input.status,
    query: input.query,
    page: input.page ?? 1,
    perPage: 20,
  });
}
