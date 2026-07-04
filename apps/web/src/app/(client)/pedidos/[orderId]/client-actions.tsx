"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptQuoteAction, cancelOrderAction } from "@/server/actions/order";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

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

  function accept() {
    startTransition(async () => {
      const res = await acceptQuoteAction(orderId);
      if (res.ok) router.refresh();
      else toast.error(res.error);
    });
  }
  function cancel() {
    if (!confirm("Cancelar este pedido?")) return;
    startTransition(async () => {
      const res = await cancelOrderAction(orderId);
      if (res.ok) router.refresh();
      else toast.error(res.error);
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
    </div>
  );
}
