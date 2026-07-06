import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import type { Artist } from "@inkvision/core";

/** Equipe pública do estúdio — mesma linguagem de lista do diretório /tatuadores. */
export function StudioTeam({ artists }: { artists: Artist[] }) {
  if (artists.length === 0) return null;

  return (
    <section className="mt-20">
      <div className="mb-2 flex items-end justify-between border-b border-border pb-4">
        <h2 className="font-display text-3xl font-light tracking-[-0.02em]">Tatuadores</h2>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {String(artists.length).padStart(2, "0")}{" "}
          {artists.length === 1 ? "artista" : "artistas"}
        </span>
      </div>
      <ul>
        {artists.map((a, i) => (
          <li key={a.id}>
            <Link
              href={`/t/${a.id}`}
              className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-border py-6 transition-colors hover:bg-muted/40 sm:gap-6"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <span className="font-display text-2xl leading-tight sm:text-3xl">{a.name}</span>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {a.styles.map((s) => s.name).join(" · ") || "Sem estilos definidos"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 justify-self-end">
                {a.ratingCount > 0 && (
                  <span className="inline-flex items-center gap-1 font-mono text-sm tabular-nums text-muted-foreground">
                    <Star className="size-3.5 fill-primary text-primary" />
                    {a.ratingAvg?.toFixed(1)}
                  </span>
                )}
                <ArrowUpRight className="size-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
