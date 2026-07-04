import Link from "next/link";
import type { Metadata } from "next";
import { repositories } from "@/server/container";
import { getDiscoveryArtists } from "@/server/public-cache";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";
const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Tatuadores",
  description: "Encontre tatuadores por estilo e comece seu projeto na InkVision.",
  alternates: { canonical: `${APP_URL}/tatuadores` },
};

/** Monta a querystring preservando estilo/q e trocando a página. */
function pageHref(sp: { estilo?: string; q?: string }, page: number): string {
  const qs = new URLSearchParams();
  if (sp.estilo) qs.set("estilo", sp.estilo);
  if (sp.q) qs.set("q", sp.q);
  if (page > 1) qs.set("page", String(page));
  const s = qs.toString();
  return s ? `/tatuadores?${s}` : "/tatuadores";
}

export default async function ArtistsDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ estilo?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const [styles, { items, total }] = await Promise.all([
    repositories.styles.listAll(),
    getDiscoveryArtists({
      styleSlug: sp.estilo,
      query: sp.q,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Tatuadores</h1>
      <p className="mt-1 text-muted-foreground">{total} artista(s) disponíveis</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/tatuadores"
          className={cn(
            "rounded-full border px-4 py-2 text-sm",
            !sp.estilo ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground",
          )}
        >
          Todos
        </Link>
        {styles.map((s) => (
          <Link
            key={s.id}
            href={`/tatuadores?estilo=${s.slug}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm",
              sp.estilo === s.slug
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-12 text-muted-foreground">Nenhum tatuador encontrado para este filtro.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <Link key={a.id} href={`/t/${a.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{a.name}</span>
                    {a.ratingCount > 0 && (
                      <span className="text-sm text-muted-foreground">★ {a.ratingAvg?.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {a.styles.slice(0, 3).map((s) => (
                      <Badge key={s.id} variant="neutral">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                  {a.avgPriceCents != null && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      ⌀ R$ {(a.avgPriceCents / 100).toFixed(0)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-between">
          {page > 1 ? (
            <Link
              href={pageHref(sp, page - 1)}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              ← Anterior
            </Link>
          ) : (
            <span className="rounded-full border border-border/40 px-4 py-2 text-sm text-muted-foreground/40">
              ← Anterior
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={pageHref(sp, page + 1)}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Próxima →
            </Link>
          ) : (
            <span className="rounded-full border border-border/40 px-4 py-2 text-sm text-muted-foreground/40">
              Próxima →
            </span>
          )}
        </div>
      )}
    </div>
  );
}
