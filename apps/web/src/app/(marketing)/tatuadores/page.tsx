import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Star } from "lucide-react";
import { repositories } from "@/server/container";
import { getDiscoveryArtists } from "@/server/public-cache";
import { getPublicStats } from "@/server/queries/home";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { cn } from "@/lib/utils";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Tatuadores",
  description: "Encontre tatuadores por estilo e comece seu projeto na InkVision.",
  alternates: { canonical: `${APP_URL}/tatuadores` },
};

/** Monta a querystring preservando os filtros ativos e trocando a página. */
function pageHref(
  sp: { estilo?: string; q?: string; city?: string; studio?: string },
  page: number,
): string {
  const qs = new URLSearchParams();
  if (sp.estilo) qs.set("estilo", sp.estilo);
  if (sp.q) qs.set("q", sp.q);
  if (sp.city) qs.set("city", sp.city);
  if (sp.studio) qs.set("studio", sp.studio);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/tatuadores?${s}` : "/tatuadores";
}

export default async function ArtistsDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ estilo?: string; q?: string; city?: string; studio?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [styles, { items, total, failed }, stats] = await Promise.all([
    repositories.styles.listAll().catch(() => []),
    getDiscoveryArtists({
      styleSlug: sp.estilo,
      query: sp.q,
      city: sp.city,
      studioName: sp.studio,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    getPublicStats(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">O diretório · Ateliês & artistas</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          Tatuadores
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {String(total).padStart(2, "0")} {total === 1 ? "artista" : "artistas"}
        </p>
      </div>

      {/* Faixa de prova social — números reais do marketplace */}
      <ProofStrip stats={stats} show={["rating", "simulations", "studios"]} />

      {/* Busca por texto e cidade — GET pra própria rota, preserva os demais filtros */}
      <form action="/tatuadores" method="GET" className="mt-8 flex flex-wrap gap-3">
        {sp.estilo && <input type="hidden" name="estilo" value={sp.estilo} />}
        {sp.studio && <input type="hidden" name="studio" value={sp.studio} />}
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por nome ou estúdio"
          aria-label="Buscar por nome ou estúdio"
          className="min-w-[200px] flex-1 border border-border bg-transparent px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="text"
          name="city"
          defaultValue={sp.city ?? ""}
          placeholder="Cidade"
          aria-label="Cidade"
          className="w-full border border-border bg-transparent px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-48"
        />
        <button
          type="submit"
          className="border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
        >
          Buscar
        </button>
      </form>

      {/* Filtros — ticks editoriais, não pílulas */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-y border-border py-4">
        <Link
          href="/tatuadores"
          className={cn(
            "inline-flex items-center py-3 text-sm transition-colors sm:py-0",
            !sp.estilo ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          Todos
        </Link>
        {styles.map((s) => (
          <Link
            key={s.id}
            href={`/tatuadores?estilo=${s.slug}`}
            className={cn(
              "inline-flex items-center py-3 text-sm transition-colors sm:py-0",
              sp.estilo === s.slug
                ? "font-medium text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {failed ? (
        <p className="mt-16 font-display text-2xl text-muted-foreground">
          Não foi possível carregar os tatuadores agora. Tente novamente em instantes.
        </p>
      ) : items.length === 0 ? (
        <p className="mt-16 font-display text-2xl text-muted-foreground">
          Nenhum tatuador para este filtro.
        </p>
      ) : (
        <ul className="mt-4">
          {items.map((a, i) => (
            <li key={a.id}>
              <Link
                href={`/t/${a.id}`}
                className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-border py-6 transition-colors hover:bg-muted/40 sm:grid-cols-[3rem_1.4fr_1fr_auto] sm:gap-6 sm:px-2"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String((page - 1) * PAGE_SIZE + i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <span className="font-display text-2xl leading-tight transition-colors group-hover:text-primary sm:text-3xl">
                    {a.name}
                  </span>
                  {a.avgPriceCents != null && (
                    <span className="ml-3 font-mono text-xs text-muted-foreground">
                      a partir de R$ {(a.avgPriceCents / 100).toFixed(0)}
                    </span>
                  )}
                </div>
                <div className="hidden flex-wrap gap-1.5 sm:flex">
                  {a.styles.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 justify-self-end">
                  {a.ratingCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="size-3.5 fill-primary text-primary" />
                      {a.ratingAvg?.toFixed(1)}
                    </span>
                  )}
                  <ArrowUpRight className="size-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="mt-12 flex items-center justify-between">
          {page > 1 ? (
            <Link href={pageHref(sp, page - 1)} className="ink-link text-sm hover:text-primary">
              ← Anterior
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground/40">← Anterior</span>
          )}
          <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(sp, page + 1)} className="ink-link text-sm hover:text-primary">
              Próxima →
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground/40">Próxima →</span>
          )}
        </div>
      )}
    </div>
  );
}
