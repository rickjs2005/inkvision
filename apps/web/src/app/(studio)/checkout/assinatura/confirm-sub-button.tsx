"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmSubscriptionAction } from "@/server/actions/payment";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function ConfirmSubButton({ studioId, planSlug }: { studioId: string; planSlug: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const res = await confirmSubscriptionAction(studioId, planSlug);
    if (res.ok) {
      router.push("/painel");
      router.refresh();
    } else {
      toast.error(res.error);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button size="lg" onClick={confirm} disabled={busy}>
        {busy ? "Ativando…" : "Simular assinatura"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Ambiente de desenvolvimento — nenhum valor é cobrado.
      </p>
    </div>
  );
}
