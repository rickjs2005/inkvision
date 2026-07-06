import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { getStudioArtists, getStudioPortfolio } from "@/server/public-cache";
import { StudioProfile } from "../studio-profile";

/**
 * Prévia do estúdio para dono/admin ANTES da publicação (status != ACTIVE).
 * Dinâmica de propósito (depende do viewer) — a página pública /s/{slug} é
 * estática e mostra apenas estúdios publicados.
 */
export const metadata: Metadata = {
  title: "Prévia do estúdio",
  robots: { index: false, follow: false },
};

export default async function StudioPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const actor = await requireActor();

  let studio;
  try {
    // O caso de uso autoriza: dono/admin enxergam qualquer status; outros, só ACTIVE.
    studio = await useCases.getStudioBySlug.execute(slug, actor);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  const [artists, portfolio] = await Promise.all([
    getStudioArtists(studio.id),
    getStudioPortfolio(studio.id),
  ]);

  return <StudioProfile studio={studio} artists={artists} portfolio={portfolio} />;
}
