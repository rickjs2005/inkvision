"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { connectPaymentsAction, subscribeStudioAction } from "@/server/actions/payment";
import { Button } from "@/components/ui/button";

export function ConnectButton({
  studioId,
  label = "Conectar pagamentos",
}: {
  studioId: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await connectPaymentsAction(studioId);
            // URL do provedor (Stripe) é externa — navegação completa.
            if (res.ok) window.location.href = res.data.url;
            else setError(res.error);
          })
        }
      >
        {pending ? "Abrindo…" : label}
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
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        className="w-full"
        variant={current ? "outline" : "default"}
        disabled={busy || current}
        onClick={async () => {
          setBusy(true);
          setError(null);
          const res = await subscribeStudioAction(studioId, planSlug);
          if (res.ok) {
            router.push(res.data.url);
          } else {
            setBusy(false);
            setError(res.error);
          }
        }}
      >
        {busy ? "Abrindo…" : current ? "Plano atual" : "Assinar"}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
