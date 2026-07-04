"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendQuoteAction } from "@/server/actions/order";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const baseInput =
  "peer w-full rounded-md border border-input bg-background/40 text-sm outline-none transition-[border-color,box-shadow,background-color] hover:border-foreground/25 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/12";

/** Campo monetário premium: label flutuante + prefixo R$ mono (foco vermelhão). */
function MoneyField({
  id,
  name,
  label,
  defaultValue,
  required,
  min = 1,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | number;
  required?: boolean;
  min?: number;
}) {
  const [val, setVal] = useState(defaultValue != null ? String(defaultValue) : "");
  const [focused, setFocused] = useState(false);
  const active = focused || val.length > 0;

  return (
    <div className="relative">
      <span
        className={cn(
          "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm transition-colors",
          focused ? "text-primary" : "text-muted-foreground/70",
        )}
      >
        R$
      </span>
      <input
        id={id}
        name={name}
        type="number"
        inputMode="decimal"
        min={min}
        step="0.01"
        required={required}
        defaultValue={defaultValue}
        placeholder=" "
        onChange={(e) => setVal(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(baseInput, "h-14 pl-10 pr-3.5 pt-4 font-mono tabular-nums")}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-10 origin-left transition-all",
          active
            ? "top-2 text-[11px] font-medium text-muted-foreground"
            : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground/70",
        )}
      >
        {label}
      </label>
    </div>
  );
}

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
    <form onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2">
      <MoneyField
        id="quoteAmount"
        name="quoteAmount"
        label="Valor total"
        min={1}
        required
        defaultValue={defaultQuote}
      />
      <MoneyField
        id="depositAmount"
        name="depositAmount"
        label="Sinal"
        min={1}
        required
        defaultValue={defaultDeposit}
      />
      <div className="flex items-center gap-4 border-t border-border pt-5 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Enviar orçamento"}
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
