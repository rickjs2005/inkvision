"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptQuoteAction, cancelOrderAction } from "@/server/actions/order";
import { Button } from "@/components/ui/button";

export function OrderClientActions({
  orderId,
  canAccept,
  canCancel,
}: {
  orderId: string;
  canAccept: boolean;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    startTransition(async () => {
      const res = await acceptQuoteAction(orderId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }
  function cancel() {
    if (!confirm("Cancelar este pedido?")) return;
    setError(null);
    startTransition(async () => {
      const res = await cancelOrderAction(orderId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  if (!canAccept && !canCancel) return null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {canAccept && (
        <Button onClick={accept} disabled={pending}>
          Aceitar orçamento e seguir para o sinal
        </Button>
      )}
      {canCancel && (
        <Button variant="outline" onClick={cancel} disabled={pending}>
          Cancelar pedido
        </Button>
      )}
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
