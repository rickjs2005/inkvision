import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicStudio, getStudioArtists, getStudioPortfolio } from "@/server/public-cache";
import { StudioProfile } from "./studio-profile";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// ISR de verdade: página 100% pública (só estúdios ACTIVE), sem nada de
// viewer — gerada estática e revalidada a cada 5 min. A prévia de estúdio
// não publicado (dono/admin) vive em /s/{slug}/previa, dinâmica.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getPublicStudio(slug);
  if (!studio) return { title: "Estúdio não encontrado" };
  return {
    title: studio.name,
    description: studio.description ?? `Conheça o estúdio ${studio.name} na InkVision.`,
    alternates: { canonical: `${APP_URL}/s/${slug}` },
    openGraph: { title: studio.name, description: studio.description ?? undefined, type: "profile" },
  };
}

export default async function StudioPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio = await getPublicStudio(slug);
  if (!studio) notFound();

  const [artists, portfolio] = await Promise.all([
    getStudioArtists(studio.id),
    getStudioPortfolio(studio.id),
  ]);

  return <StudioProfile studio={studio} artists={artists} portfolio={portfolio} />;
}
