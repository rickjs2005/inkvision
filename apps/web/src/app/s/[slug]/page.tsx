import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { getActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Badge } from "@/components/ui/badge";
import { LocalBusinessJsonLd } from "@/components/seo/json-ld";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

async function loadStudio(slug: string) {
  try {
    const actor = await getActor();
    return await useCases.getStudioBySlug.execute(slug, actor);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") return null;
    throw e;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const studio = await loadStudio(slug);
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
  const studio = await loadStudio(slug);
  if (!studio) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <LocalBusinessJsonLd
        name={studio.name}
        description={studio.description ?? undefined}
        city={studio.address.city ?? undefined}
        state={studio.address.state ?? undefined}
        phone={studio.phone ?? undefined}
        slug={slug}
      />
      {studio.status !== "ACTIVE" && (
        <Badge variant="warning" className="mb-4">
          Prévia — estúdio ainda não publicado
        </Badge>
      )}
      <h1 className="text-4xl font-bold tracking-tight">{studio.name}</h1>
      {studio.description && (
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{studio.description}</p>
      )}
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        {studio.phone && (
          <div>
            <dt className="text-sm text-muted-foreground">Telefone</dt>
            <dd>{studio.phone}</dd>
          </div>
        )}
        {(studio.address.city || studio.address.state) && (
          <div>
            <dt className="text-sm text-muted-foreground">Localização</dt>
            <dd>
              {[studio.address.city, studio.address.state].filter(Boolean).join(" · ")}
            </dd>
          </div>
        )}
      </dl>
      <p className="mt-10 text-sm text-muted-foreground">
        Portfólio dos tatuadores em breve.
      </p>
    </div>
  );
}
