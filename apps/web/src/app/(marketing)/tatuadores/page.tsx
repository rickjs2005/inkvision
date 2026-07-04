import Link from "next/link";
import type { Metadata } from "next";
import { repositories, useCases } from "@/server/container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tatuadores",
  description: "Encontre tatuadores por estilo e comece seu projeto na InkVision.",
};

export default async function ArtistsDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ estilo?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const [styles, { items, total }] = await Promise.all([
    repositories.styles.listAll(),
    useCases.listPublicArtists.execute({ styleSlug: sp.estilo, query: sp.q, take: 24 }),
  ]);

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
    </div>
  );
}
