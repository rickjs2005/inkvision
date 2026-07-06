import { Fragment, type ReactElement } from "react";
import { Star } from "lucide-react";
import { formatRating, formatStatCount, type PublicStats } from "@/lib/public-stats";

type StatKey = "rating" | "simulations" | "studios" | "reviews";

/**
 * Faixa de prova social dos diretórios públicos — apenas números reais.
 * Cada entrada só aparece quando existe; sem nenhuma, a faixa some.
 */
export function ProofStrip({ stats, show }: { stats: PublicStats | null; show: StatKey[] }) {
  if (!stats) return null;

  const entries = show
    .map((key) => {
      switch (key) {
        case "rating":
          return stats.ratingAvg && stats.ratingCount > 0 ? (
            <span key={key} className="inline-flex items-center gap-1.5">
              <Star className="size-3.5 fill-primary text-primary" />
              <span className="font-display text-sm tracking-normal text-foreground">
                {formatRating(stats.ratingAvg)}
              </span>
              média
            </span>
          ) : null;
        case "simulations":
          return stats.simulations > 0 ? (
            <span key={key}>
              <span className="font-display text-sm tracking-normal text-foreground">
                {formatStatCount(stats.simulations)}
              </span>{" "}
              {stats.simulations === 1 ? "simulação" : "simulações"}
            </span>
          ) : null;
        case "studios":
          return stats.activeStudios > 0 ? (
            <span key={key}>
              <span className="font-display text-sm tracking-normal text-foreground">
                {formatStatCount(stats.activeStudios)}
              </span>{" "}
              {stats.activeStudios === 1 ? "estúdio" : "estúdios"}
            </span>
          ) : null;
        case "reviews":
          return stats.ratingCount > 0 ? (
            <span key={key}>
              <span className="font-display text-sm tracking-normal text-foreground">
                {formatStatCount(stats.ratingCount)}
              </span>{" "}
              {stats.ratingCount === 1 ? "avaliação" : "avaliações"}
            </span>
          ) : null;
      }
    })
    .filter((e): e is ReactElement => e != null);

  if (entries.length === 0) return null;

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
      {entries.map((entry, i) => (
        <Fragment key={entry.key}>
          {i > 0 && <span className="text-border">·</span>}
          {entry}
        </Fragment>
      ))}
    </div>
  );
}
