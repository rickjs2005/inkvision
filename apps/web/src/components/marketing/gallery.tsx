import Image from "next/image";
import Link from "next/link";
import type { GalleryItem } from "@/server/queries/home";
import { Reveal } from "@/components/motion/reveal";

export function Gallery({ items }: { items: GalleryItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <h2 className="text-3xl font-bold tracking-tight">Galeria</h2>
        <p className="mt-2 text-muted-foreground">Trabalhos recentes dos nossos artistas.</p>
      </Reveal>
      <Reveal className="mt-10 columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
        {items.map((it, i) => (
          <Link
            key={it.id}
            href={`/t/${it.artistId}`}
            className="group block break-inside-avoid overflow-hidden rounded-xl border border-border"
          >
            <Image
              src={it.imageUrl}
              alt={`Trabalho de ${it.artistName}`}
              width={400}
              height={i % 3 === 0 ? 560 : 400}
              className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        ))}
      </Reveal>
    </section>
  );
}
