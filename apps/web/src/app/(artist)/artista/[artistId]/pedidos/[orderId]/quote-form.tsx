"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendQuoteAction } from "@/server/actions/order";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QuoteForm({
  studioId,
  orderId,
  artistId,
  defaultQuote,
  defaultDeposit,
}: {
  studioId: string;
  orderId: string;
  artistId: string;
  defaultQuote?: number;
  defaultDeposit?: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const quoteAmount = Number(form.get("quoteAmount"));
    const depositAmount = Number(form.get("depositAmount"));
    startTransition(async () => {
      const res = await sendQuoteAction(studioId, orderId, artistId, { quoteAmount, depositAmount });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="quoteAmount">Valor total (R$)</Label>
        <Input id="quoteAmount" name="quoteAmount" type="number" min={1} step="0.01" required defaultValue={defaultQuote} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="depositAmount">Sinal (R$)</Label>
        <Input id="depositAmount" name="depositAmount" type="number" min={1} step="0.01" required defaultValue={defaultDeposit} />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar orçamento"}
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
