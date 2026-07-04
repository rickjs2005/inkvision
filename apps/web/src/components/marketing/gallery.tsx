import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { GalleryItem } from "@/server/queries/home";
import { Reveal } from "@/components/motion/reveal";

/** Alturas variadas para um mosaico editorial — nada de grid quadrado uniforme. */
const SPANS = ["h-64", "h-80", "h-96", "h-72", "h-[28rem]", "h-80"];

export function Gallery({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
      {/* Cabeçalho editorial à esquerda */}
      <Reveal className="max-w-xl">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          <span className="eyebrow">Portfólio vivo</span>
        </div>
        <h2 className="mt-6 font-display text-4xl font-light tracking-[-0.02em] sm:text-5xl">
          Trabalhos recentes,
          <br />
          <span className="italic text-primary">tinta de verdade.</span>
        </h2>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Uma seleção do que está saindo das agulhas dos nossos artistas. Clique para conhecer o
          tatuador por trás de cada peça.
        </p>
      </Reveal>

      {/* Mosaico masonry assimétrico */}
      <Reveal
        delay={0.1}
        className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5"
      >
        {items.map((it, i) => (
          <Link
            key={it.id}
            href={`/t/${it.artistId}`}
            className="group relative block break-inside-avoid overflow-hidden rounded-lg border border-border bg-muted shadow-[var(--shadow-ink)]"
          >
            <div className={`relative w-full ${SPANS[i % SPANS.length]}`}>
              <Image
                src={it.imageUrl}
                alt={`Tatuagem de ${it.artistName}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              {/* overlay escuro que revela o rótulo no hover */}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <div className="flex w-full items-end justify-between gap-3 p-5">
                  <div>
                    <span className="eyebrow text-white/70">Artista</span>
                    <p className="mt-1 font-display text-lg font-light text-white">
                      {it.artistName}
                    </p>
                  </div>
                  <ArrowUpRight className="size-5 shrink-0 text-white" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
