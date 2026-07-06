import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Instagram, Sparkles, Star } from "lucide-react";
import {
  getPublicArtist,
  getPublicArtistPortfolio,
  getPublicArtistReviews,
} from "@/server/public-cache";
import { Button } from "@/components/ui/button";
import { PersonJsonLd } from "@/components/seo/json-ld";
import { PortfolioGallery } from "./portfolio-gallery";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// ISR de verdade: nada aqui depende do viewer (likes/sessão hidratam no
// cliente) — a página é gerada estática e revalidada a cada 5 min.
export const revalidate = 300;

// Sem pré-gerar nenhum artista no build (o banco pode nem estar acessível);
// cada perfil é gerado na primeira visita e cacheado (dynamicParams default).
export function generateStaticParams(): Array<{ artistId: string }> {
  return [];
}

const reviewFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artistId: string }>;
}): Promise<Metadata> {
  const { artistId } = await params;
  const artist = await getPublicArtist(artistId);
  if (!artist) return { title: "Tatuador não encontrado" };
  const styles = artist.styles.map((s) => s.name).join(", ");
  return {
    title: artist.name,
    description: artist.bio ?? `${artist.name} — ${styles || "tatuador"} na InkVision.`,
    alternates: { canonical: `${APP_URL}/t/${artistId}` },
    openGraph: { title: artist.name, type: "profile" },
  };
}

export default async function ArtistPublicPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  // Tudo público e cacheado — o que depende do viewer (like/sessão) é
  // hidratado no cliente pela própria galeria.
  const artist = await getPublicArtist(artistId);
  if (!artist) notFound();
  const [items, reviews] = await Promise.all([
    getPublicArtistPortfolio(artistId),
    getPublicArtistReviews(artistId),
  ]);
  const firstName = artist.name.split(" ")[0] ?? artist.name;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <PersonJsonLd
        name={artist.name}
        description={artist.bio ?? undefined}
        sameAs={artist.instagram ? [`https://instagram.com/${artist.instagram}`] : undefined}
      />

      {/* Cabeçalho editorial do artista */}
      <header>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          <span className="eyebrow">O ateliê · Artista</span>
        </div>

        <h1 className="mt-6 font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          {artist.name}
        </h1>

        {artist.styles.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1.5">
            {artist.styles.map((s) => (
              <span
                key={s.id}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
              >
                {s.name}
              </span>
            ))}
          </div>
        )}

        {/* Meta em régua mono */}
        <dl className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-border py-4">
          {artist.ratingCount > 0 && (
            <div className="flex items-center gap-2">
              <Star className="size-4 fill-primary text-primary" />
              <span className="font-mono text-sm">
                {artist.ratingAvg?.toFixed(1)}
                <span className="text-muted-foreground"> · {artist.ratingCount}</span>
              </span>
            </div>
          )}
          {artist.avgPriceCents != null && (
            <div>
              <dt className="sr-only">Preço médio</dt>
              <dd className="font-mono text-sm text-muted-foreground">
                A partir de{" "}
                <span className="text-foreground">
                  R$ {(artist.avgPriceCents / 100).toFixed(0)}
                </span>
              </dd>
            </div>
          )}
          {artist.experienceYears != null && (
            <div>
              <dt className="sr-only">Experiência</dt>
              <dd className="font-mono text-sm text-muted-foreground">
                <span className="text-foreground">{artist.experienceYears}</span> anos de agulha
              </dd>
            </div>
          )}
          {artist.instagram && (
            <a
              href={`https://instagram.com/${artist.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Instagram className="size-4" />
              @{artist.instagram}
            </a>
          )}
        </dl>

        {artist.bio && (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {artist.bio}
          </p>
        )}

        {/* Prova de autoridade — números reais do artista */}
        <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-5 border-t border-border pt-7">
          {artist.ratingCount > 0 && (
            <div>
              <dt className="inline-flex items-center gap-1.5 font-display text-3xl leading-none tracking-tight sm:text-4xl">
                <Star className="size-6 fill-primary text-primary sm:size-7" />
                {artist.ratingAvg?.toFixed(1)}
              </dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {artist.ratingCount} {artist.ratingCount === 1 ? "avaliação" : "avaliações"}
              </dd>
            </div>
          )}
          <div>
            <dt className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
              {String(items.length).padStart(2, "0")}
            </dt>
            <dd className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              {items.length === 1 ? "trabalho no portfólio" : "trabalhos no portfólio"}
            </dd>
          </div>
          {reviews.length > 0 && (
            <div>
              <dt className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
                {String(reviews.length).padStart(2, "0")}
              </dt>
              <dd className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                relatos de clientes
              </dd>
            </div>
          )}
        </dl>

        {/* CTA dominante — simular na própria pele */}
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button size="lg" asChild className="group/cta">
            <Link href="/cadastro">
              <Sparkles className="transition-transform group-hover/cta:rotate-12" />
              Simular tatuagem com {firstName}
              <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={`/pedidos/novo/${artist.id}`}>
              Iniciar um projeto
              <ArrowUpRight className="transition-transform group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Grátis <span className="text-primary">·</span> veja na sua pele antes da agulha
        </p>
      </header>

      {/* Portfólio */}
      <section className="mt-20">
        <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
          <h2 className="font-display text-3xl font-light tracking-[-0.02em]">Portfólio</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {String(items.length).padStart(2, "0")}{" "}
            {items.length === 1 ? "peça" : "peças"}
          </span>
        </div>
        <PortfolioGallery items={items} artistId={artistId} />
      </section>

      {reviews.length > 0 && (
        <section className="mt-20">
          <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
            <h2 className="font-display text-3xl font-light tracking-[-0.02em]">Avaliações</h2>
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {String(reviews.length).padStart(2, "0")}
            </span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
            {reviews.map((r) => (
              <figure key={r.id} className="flex flex-col justify-between gap-4 bg-card p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-0.5" aria-label={`${r.rating} de 5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={
                          i < r.rating
                            ? "size-3.5 fill-primary text-primary"
                            : "size-3.5 text-border"
                        }
                      />
                    ))}
                  </div>
                  <time className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {reviewFmt.format(new Date(r.createdAt))}
                  </time>
                </div>
                {r.comment && (
                  <blockquote className="text-sm leading-relaxed text-muted-foreground">
                    {r.comment}
                  </blockquote>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
