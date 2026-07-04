import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { Artist } from "@inkvision/core";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";

function price(cents: number) {
  return `R$ ${(cents / 100).toFixed(0)}`;
}

export function TopArtists({ artists }: { artists: Artist[] }) {
  const [featured, ...rest] = artists;
  if (!featured) return null;

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <Reveal className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow">Mais bem avaliados</span>
          </div>
          <h2 className="mt-6 font-display text-4xl font-light leading-[1.0] tracking-[-0.02em] sm:text-5xl">
            Melhores tatuadores
          </h2>
        </div>
        <Link
          href="/tatuadores"
          className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <span className="ink-link">Ver todos</span>
          <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </Reveal>

      <RevealStagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Artista em destaque — card maior (assimetria) */}
        <RevealItem className="sm:col-span-2">
          <ArtistCard artist={featured} featured />
        </RevealItem>

        {rest.map((a) => (
          <RevealItem key={a.id}>
            <ArtistCard artist={a} />
          </RevealItem>
        ))}
      </RevealStagger>
    </section>
  );
}

function ArtistCard({ artist: a, featured = false }: { artist: Artist; featured?: boolean }) {
  return (
    <Link
      href={`/t/${a.id}`}
      className="group flex h-full flex-col justify-between rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className={
            featured
              ? "font-display text-3xl font-light leading-none tracking-[-0.01em] sm:text-4xl"
              : "font-display text-xl font-light leading-tight"
          }
        >
          {a.name}
        </h3>
        {a.ratingCount > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground">
            <Star className="size-3.5 fill-primary text-primary" />
            {a.ratingAvg?.toFixed(1)}
            <span className="text-muted-foreground/60">({a.ratingCount})</span>
          </span>
        )}
      </div>

      <div className={featured ? "mt-6 flex items-end justify-between gap-4" : "mt-5 flex items-end justify-between gap-4"}>
        <div className="flex flex-wrap gap-1.5">
          {a.styles.slice(0, featured ? 4 : 2).map((s) => (
            <Badge key={s.id} variant="neutral">
              {s.name}
            </Badge>
          ))}
        </div>
        {a.avgPriceCents != null && (
          <div className="shrink-0 text-right">
            <div className="eyebrow text-[10px]">A partir de</div>
            <div className="font-mono text-sm tabular-nums text-foreground">{price(a.avgPriceCents)}</div>
          </div>
        )}
      </div>
    </Link>
  );
}
