"use client";

import { useActionState, useState } from "react";
import { Instagram, CalendarClock } from "lucide-react";
import type { Artist } from "@inkvision/core";
import { updateArtistAction } from "@/server/actions/artist";
import { FloatingInput, FloatingTextarea } from "@/components/ui/field";
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
  min = 0,
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

export function ProfileForm({ artist }: { artist: Artist }) {
  const action = updateArtistAction.bind(null, artist.id);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FloatingTextarea
          id="bio"
          name="bio"
          label="Biografia — trajetória, técnica e o que torna seu traço único"
          rows={4}
          defaultValue={artist.bio ?? ""}
        />
      </div>

      <FloatingInput
        id="experienceYears"
        name="experienceYears"
        label="Anos de experiência"
        type="number"
        icon={CalendarClock}
        inputMode="numeric"
        min={0}
        defaultValue={artist.experienceYears ?? ""}
        className="font-mono tabular-nums"
      />

      <FloatingInput
        id="instagram"
        name="instagram"
        label="Instagram"
        icon={Instagram}
        defaultValue={artist.instagram ?? ""}
        validate={(v) => v.trim().length >= 2}
      />

      <MoneyField
        id="avgPrice"
        name="avgPrice"
        label="Preço médio"
        min={0}
        defaultValue={artist.avgPriceCents ? (artist.avgPriceCents / 100).toFixed(2) : undefined}
      />

      <label className="flex cursor-pointer items-center gap-2.5 self-center text-sm select-none">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={artist.isActive}
          className="size-4 accent-primary"
        />
        Perfil ativo <span className="text-muted-foreground">(visível ao público)</span>
      </label>

      <div className="flex items-center gap-4 border-t border-border pt-5 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </Button>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state?.ok && (
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-emerald-500">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Salvo
          </span>
        )}
      </div>
    </form>
  );
}
