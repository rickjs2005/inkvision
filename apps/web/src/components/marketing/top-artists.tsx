import Link from "next/link";
import type { Artist } from "@inkvision/core";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function TopArtists({ artists }: { artists: Artist[] }) {
  if (artists.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Melhores tatuadores</h2>
          <p className="mt-2 text-muted-foreground">Os artistas mais bem avaliados da plataforma.</p>
        </div>
        <Link href="/tatuadores" className="hidden text-sm text-primary hover:underline sm:block">
          Ver todos →
        </Link>
      </Reveal>

      <RevealStagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {artists.map((a) => (
          <RevealItem key={a.id}>
            <Link href={`/t/${a.id}`}>
              <Card className="h-full transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{a.name}</span>
                    {a.ratingCount > 0 && (
                      <span className="text-sm text-muted-foreground">★ {a.ratingAvg?.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {a.styles.slice(0, 2).map((s) => (
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
          </RevealItem>
        ))}
      </RevealStagger>
    </section>
  );
}
