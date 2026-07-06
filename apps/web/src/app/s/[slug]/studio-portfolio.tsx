import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { StudioPortfolioItem } from "@/server/public-cache";

/** Portfólio combinado dos tatuadores do estúdio — mesma linguagem visual do perfil do artista. */
export function StudioPortfolio({ items }: { items: StudioPortfolioItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-8 flex items-end justify-between border-b border-border pb-4">
        <h2 className="font-display text-3xl font-light tracking-[-0.02em]">Portfólio</h2>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {String(items.length).padStart(2, "0")} {items.length === 1 ? "peça" : "peças"}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.id}
            href={`/t/${it.artistId}`}
            className="group relative block aspect-square overflow-hidden rounded-lg border border-border bg-muted"
          >
            <Image
              src={it.imageUrl}
              alt={`Tatuagem de ${it.artistName}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="flex w-full items-end justify-between gap-3 p-4">
                <div>
                  <span className="eyebrow text-white/70">Artista</span>
                  <p className="mt-1 font-display text-base font-light text-white">
                    {it.artistName}
                  </p>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
