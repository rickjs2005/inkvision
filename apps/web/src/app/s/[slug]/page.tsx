import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, MapPin, Phone, Sparkles, Users } from "lucide-react";
import { DomainError } from "@inkvision/core";
import { getActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { getPublicStudio, getStudioArtists, getStudioPortfolio } from "@/server/public-cache";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LocalBusinessJsonLd } from "@/components/seo/json-ld";
import { StudioTeam } from "./studio-team";
import { StudioPortfolio } from "./studio-portfolio";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

async function loadStudio(slug: string) {
  // Caminho público (ACTIVE) cacheado, independente do viewer.
  const cached = await getPublicStudio(slug);
  if (cached) return cached;
  // Fallback NÃO cacheado: prévia de dono/admin para estúdio não-ACTIVE.
  try {
    const actor = await getActor();
    if (!actor) return null;
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

  const [artists, portfolio] = await Promise.all([
    getStudioArtists(studio.id),
    getStudioPortfolio(studio.id),
  ]);

  const location = [studio.address.city, studio.address.state].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <LocalBusinessJsonLd
        name={studio.name}
        description={studio.description ?? undefined}
        city={studio.address.city ?? undefined}
        state={studio.address.state ?? undefined}
        phone={studio.phone ?? undefined}
        slug={slug}
      />

      {/* Cabeçalho editorial do estúdio */}
      <header>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          <span className="eyebrow">O ateliê · Estúdio</span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {studio.status === "ACTIVE" ? (
            <Badge variant="success">Publicado</Badge>
          ) : (
            <Badge variant="warning">Prévia — ainda não publicado</Badge>
          )}
        </div>

        <h1 className="mt-5 font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          {studio.name}
        </h1>

        {location && (
          <p className="mt-5 inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[0.14em] text-muted-foreground">
            <MapPin className="size-4 text-primary" />
            {location}
          </p>
        )}

        {studio.description && (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {studio.description}
          </p>
        )}

        {/* CTA dominante — começar projeto / conhecer os artistas */}
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild className="group/cta">
            <Link href="/cadastro">
              <Sparkles className="transition-transform group-hover/cta:rotate-12" />
              Começar projeto
              <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/tatuadores">
              <Users />
              Ver tatuadores do estúdio
            </Link>
          </Button>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Simulação de IA grátis <span className="text-primary">·</span> aprove a arte no chat antes da agulha
        </p>
      </header>

      {/* Coordenadas em régua mono */}
      <dl className="mt-10 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        {studio.phone && (
          <div className="bg-card p-5">
            <dt className="eyebrow inline-flex items-center gap-1.5">
              <Phone className="size-3.5" />
              Telefone
            </dt>
            <dd className="mt-2 font-mono text-base">{studio.phone}</dd>
          </div>
        )}
        {location && (
          <div className="bg-card p-5">
            <dt className="eyebrow inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              Localização
            </dt>
            <dd className="mt-2 font-mono text-base">{location}</dd>
          </div>
        )}
      </dl>

      <StudioTeam artists={artists} />
      <StudioPortfolio items={portfolio} />

      {artists.length === 0 && (
        <p className="mt-16 border-t border-border pt-6 font-mono text-sm text-muted-foreground">
          Portfólio dos tatuadores em breve.
        </p>
      )}
    </div>
  );
}
