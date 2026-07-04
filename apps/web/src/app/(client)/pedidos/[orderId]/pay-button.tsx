"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentKind } from "@inkvision/core";
import { startOrderPaymentAction } from "@/server/actions/payment";
import { Button } from "@/components/ui/button";

export function PayButton({ orderId, kind, label }: { orderId: string; kind: PaymentKind; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setError(null);
    const res = await startOrderPaymentAction(orderId, kind);
    if (res.ok) router.push(res.data.url);
    else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button size="lg" onClick={start} disabled={busy}>
        {busy ? "Redirecionando…" : label}
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}
