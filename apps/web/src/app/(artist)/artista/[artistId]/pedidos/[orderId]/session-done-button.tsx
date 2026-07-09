"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { markSessionDoneAction } from "@/server/actions/order";
import { Button } from "@/components/ui/button";

/** Marca a sessão como realizada — libera o pagamento do valor final pro cliente. */
export function SessionDoneButton({
  studioId,
  orderId,
  artistId,
}: {
  studioId: string;
  orderId: string;
  artistId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    setError(null);
    startTransition(async () => {
      const res = await markSessionDoneAction(studioId, orderId, artistId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={onClick} disabled={pending}>
        <CheckCircle2 />
        {pending ? "Marcando…" : "Marcar sessão como realizada"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Libera o pagamento do valor final para o cliente.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
