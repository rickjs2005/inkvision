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
      <div className="flex flex-col gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={cn("size-5", n <= existing.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
            />
          ))}
        </div>
        {existing.comment && <p className="text-sm">“{existing.comment}”</p>}
        <p className="text-sm text-emerald-500">Obrigado pela avaliação!</p>
      </div>
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

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} estrelas`}
          >
            <Star
              className={cn(
                "size-7 transition-colors",
                n <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
              )}
            />
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={3}
        placeholder="Conte como foi sua experiência (opcional)"
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
