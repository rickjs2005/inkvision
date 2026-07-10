import Link from "next/link";
import { ArrowRight, MapPin, Phone, Sparkles, Users } from "lucide-react";
import type { Artist, Studio } from "@inkvision/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthAwareCta } from "@/components/marketing/auth-aware-cta";
import { LocalBusinessJsonLd } from "@/components/seo/json-ld";
import { WhatsAppLink } from "@/lib/whatsapp";
import type { StudioPortfolioItem } from "@/server/public-cache";
import { StudioTeam } from "./studio-team";
import { StudioPortfolio } from "./studio-portfolio";

/**
 * Perfil do estúdio — compartilhado entre a página pública (estática/ISR) e a
 * prévia do dono (/s/{slug}/previa, dinâmica, para estúdios não publicados).
 */
export function StudioProfile({
  studio,
  artists,
  portfolio,
}: {
  studio: Studio;
  artists: Artist[];
  portfolio: StudioPortfolioItem[];
}) {
  const location = [studio.address.city, studio.address.state].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <LocalBusinessJsonLd
        name={studio.name}
        description={studio.description ?? undefined}
        city={studio.address.city ?? undefined}
        state={studio.address.state ?? undefined}
        phone={studio.phone ?? undefined}
        slug={studio.slug}
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
          <AuthAwareCta
            size="lg"
            className="group/cta"
            anonHref="/cadastro"
            authedHref={`/tatuadores?studio=${encodeURIComponent(studio.name)}`}
          >
            <Sparkles className="transition-transform group-hover/cta:rotate-12" />
            Começar projeto
            <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
          </AuthAwareCta>
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
            <dd className="mt-2 font-mono text-base">
              <WhatsAppLink phone={studio.phone} label={studio.phone} />
            </dd>
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
