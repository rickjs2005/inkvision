"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmSubscriptionAction } from "@/server/actions/payment";
import { Button } from "@/components/ui/button";

export function ConfirmSubButton({ studioId, planSlug }: { studioId: string; planSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    const res = await confirmSubscriptionAction(studioId, planSlug);
    if (res.ok) {
      router.push("/painel");
      router.refresh();
    } else {
      setError(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" onClick={confirm} disabled={busy}>
        {busy ? "Ativando…" : "Simular assinatura"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-center text-xs text-muted-foreground">
        Ambiente de desenvolvimento — nenhum valor é cobrado.
      </p>
    </div>
  );
}
