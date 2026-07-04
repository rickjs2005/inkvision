import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import Link from "next/link";
import { getActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonJsonLd } from "@/components/seo/json-ld";
import { PortfolioGallery } from "./portfolio-gallery";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

async function load(artistId: string, actor: Awaited<ReturnType<typeof getActor>>) {
  try {
    const artist = await useCases.getArtist.execute(artistId, actor);
    const [items, reviews] = await Promise.all([
      useCases.listPortfolio.execute(artistId, actor?.userId),
      useCases.listArtistReviews.execute(artistId, 12),
    ]);
    return { artist, items, reviews };
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") return null;
    throw e;
  }
}

const reviewFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ artistId: string }>;
}): Promise<Metadata> {
  const { artistId } = await params;
  const data = await load(artistId, null);
  if (!data) return { title: "Tatuador não encontrado" };
  const styles = data.artist.styles.map((s) => s.name).join(", ");
  return {
    title: data.artist.name,
    description: data.artist.bio ?? `${data.artist.name} — ${styles || "tatuador"} na InkVision.`,
    alternates: { canonical: `${APP_URL}/t/${artistId}` },
    openGraph: { title: data.artist.name, type: "profile" },
  };
}

export default async function ArtistPublicPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const actor = await getActor();
  const data = await load(artistId, actor);
  if (!data) notFound();
  const { artist, items, reviews } = data;

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <PersonJsonLd
        name={artist.name}
        description={artist.bio ?? undefined}
        sameAs={artist.instagram ? [`https://instagram.com/${artist.instagram}`] : undefined}
      />
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{artist.name}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {artist.styles.map((s) => (
            <Badge key={s.id}>{s.name}</Badge>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
          {artist.experienceYears != null && <span>{artist.experienceYears} anos de experiência</span>}
          {artist.avgPriceCents != null && (
            <span>Preço médio ⌀ R$ {(artist.avgPriceCents / 100).toFixed(0)}</span>
          )}
          {artist.ratingCount > 0 && (
            <span>★ {artist.ratingAvg?.toFixed(1)} ({artist.ratingCount})</span>
          )}
          {artist.instagram && <span>@{artist.instagram}</span>}
        </div>
        {artist.bio && <p className="mt-6 max-w-2xl text-lg">{artist.bio}</p>}
        <div className="mt-6">
          <Button size="lg" asChild>
            <Link href={`/pedidos/novo/${artist.id}`}>Solicitar orçamento</Link>
          </Button>
        </div>
      </header>

      <h2 className="mb-4 text-lg font-semibold">Portfólio</h2>
      <PortfolioGallery items={items} isAuthed={actor !== null} />

      {reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold">Avaliações</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                  <span className="text-xs text-muted-foreground">{reviewFmt.format(new Date(r.createdAt))}</span>
                </div>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
