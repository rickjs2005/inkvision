"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentKind } from "@inkvision/core";
import { confirmOrderPaymentAction } from "@/server/actions/payment";
import { Button } from "@/components/ui/button";

export function ConfirmButton({ orderId, kind }: { orderId: string; kind: PaymentKind }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    const res = await confirmOrderPaymentAction(orderId, kind);
    if (res.ok) {
      router.push(`/pedidos/${orderId}`);
      router.refresh();
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" onClick={pay} disabled={busy}>
        {busy ? "Processando…" : "Simular pagamento bem-sucedido"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-center text-xs text-muted-foreground">
        Ambiente de desenvolvimento — nenhum valor é cobrado.
      </p>
    </div>
  );
}
