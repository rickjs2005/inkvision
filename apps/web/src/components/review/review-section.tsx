"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { reviewOrderAction } from "@/server/actions/review";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewSection({
  orderId,
  existing,
}: {
  orderId: string;
  existing: { rating: number; comment: string | null } | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (existing) {
    return (
      <figure className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className="flex gap-1"
            role="img"
            aria-label={`Avaliação: ${existing.rating} de 5 estrelas`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                aria-hidden
                className={cn(
                  "size-5",
                  n <= existing.rating ? "fill-primary text-primary" : "text-muted-foreground/40",
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {existing.rating}/5
          </span>
        </div>

        {existing.comment && (
          <blockquote className="border-l-2 border-primary pl-4 font-display text-xl font-light italic leading-relaxed text-foreground">
            “{existing.comment}”
          </blockquote>
        )}

        <figcaption className="eyebrow">Avaliação registrada · Obrigado</figcaption>
      </figure>
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (rating < 1) return setError("Escolha de 1 a 5 estrelas.");
    const comment = (new FormData(e.currentTarget).get("comment") as string) || undefined;
    startTransition(async () => {
      const res = await reviewOrderAction(orderId, { rating, comment });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  const active = hover || rating;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex gap-1" role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
              className="rounded-sm transition-transform hover:-translate-y-0.5"
            >
              <Star
                aria-hidden
                className={cn(
                  "size-7 transition-colors",
                  n <= active ? "fill-primary text-primary" : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {active ? `${active}/5` : "toque para avaliar"}
        </span>
      </div>

      <textarea
        name="comment"
        rows={3}
        placeholder="Conte como foi sua experiência (opcional)"
        aria-label="Comentário"
        className="w-full rounded-md border border-input bg-background/40 px-3.5 py-2.5 text-sm transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:border-primary/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12"
      />

      <div>
        <Button type="submit" disabled={pending}>
          Enviar avaliação
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
