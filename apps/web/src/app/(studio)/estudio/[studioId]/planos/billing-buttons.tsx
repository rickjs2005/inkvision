"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { connectPaymentsAction, subscribeStudioAction } from "@/server/actions/payment";
import { Button } from "@/components/ui/button";

export function ConnectButton({ studioId }: { studioId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await connectPaymentsAction(studioId);
            if (res.ok) router.refresh();
            else setError(res.error);
          })
        }
      >
        Conectar pagamentos
      </Button>
      {error && <span className="text-sm text-destructive">{error}</span>}
    </div>
  );
}

export function SubscribeButton({
  studioId,
  planSlug,
  current,
}: {
  studioId: string;
  planSlug: string;
  current: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant={current ? "outline" : "default"}
      disabled={busy || current}
      onClick={async () => {
        setBusy(true);
        const res = await subscribeStudioAction(studioId, planSlug);
        if (res.ok) router.push(res.data.url);
        else setBusy(false);
      }}
    >
      {current ? "Plano atual" : "Assinar"}
    </Button>
  );
}
