"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import type { StudioStatus } from "@inkvision/core";
import { getActor, requireActor, requirePlatformAdmin } from "@/server/auth-context";
import { run, type ActionResult } from "@/server/action-result";
import { useCases } from "@/server/container";
import { enforceRateLimit } from "@/server/rate-limit";

export async function createStudioAction(
  _prev: ActionResult<{ slug: string; warning?: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ slug: string; warning?: string }>> {
  const actor = await requirePlatformAdmin();
  return run(async () => {
    // requirePlatformAdmin() já restringe a um conjunto pequeno e confiável;
    // defesa em profundidade mesmo assim.
    await enforceRateLimit(`studio-admin:${actor.userId}`, 30, 60_000);
    const { studio, ownerHasPendingStudio } = await useCases.createStudio.execute(actor, {
      name: String(formData.get("name") ?? ""),
      slug: (formData.get("slug") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
      ownerEmail: String(formData.get("ownerEmail") ?? ""),
    });
    revalidatePath("/admin/estudios");
    return {
      slug: studio.slug,
      warning: ownerHasPendingStudio
        ? "Este e-mail já é dono de outro estúdio que ainda está em onboarding (PENDING). Verifique se não é uma duplicata."
        : undefined,
    };
  });
}

export async function setStudioStatusAction(
  studioId: string,
  status: StudioStatus,
): Promise<ActionResult> {
  const actor = await requirePlatformAdmin();
  const res = await run(async () => {
    // requirePlatformAdmin() já restringe a um conjunto pequeno e confiável;
    // defesa em profundidade mesmo assim.
    await enforceRateLimit(`studio-admin:${actor.userId}`, 30, 60_000);
    return useCases.setStudioStatus.execute(actor, studioId, status);
  });
  if (res.ok) {
    revalidatePath("/admin/estudios");
    revalidateTag(`studio:${res.data.slug}`);
    // Mudar o status (ex.: SUSPENDED) pode esconder/mostrar artistas na vitrine.
    revalidateTag("artists-discovery");
    // Qualquer mudança de status pode incluir/remover o estúdio do diretório
    // público (/estudios), que só lista ACTIVE — invalida sempre, é barato.
    revalidateTag("public-studios");
  }
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function removeStudioAction(studioId: string): Promise<ActionResult> {
  const actor = await requirePlatformAdmin();
  const res = await run(async () => {
    // requirePlatformAdmin() já restringe a um conjunto pequeno e confiável;
    // defesa em profundidade mesmo assim.
    await enforceRateLimit(`studio-admin:${actor.userId}`, 30, 60_000);
    return useCases.removeStudio.execute(actor, studioId);
  });
  if (res.ok) revalidatePath("/admin/estudios");
  return res;
}

export async function completeOnboardingAction(
  studioId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const actor = await requireActor();
  const res = await run(async () => {
    await enforceRateLimit(`studio:${actor.userId}`, 10, 60_000);
    return useCases.completeOnboarding.execute(actor, studioId, {
      name: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      description: (formData.get("description") as string) || undefined,
      address: {
        street: (formData.get("street") as string) || undefined,
        city: (formData.get("city") as string) || undefined,
        state: (formData.get("state") as string) || undefined,
        zip: (formData.get("zip") as string) || undefined,
      },
    });
  });
  if (res.ok) {
    revalidatePath("/estudio");
    revalidateTag(`studio:${res.data.slug}`);
    // Onboarding concluído pode ter promovido o estúdio de PENDING para ACTIVE
    // — precisa aparecer no diretório público (/estudios) sem esperar o TTL.
    if (res.data.status === "ACTIVE") revalidateTag("public-studios");
  }
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
