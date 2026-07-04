"use client";

import { useActionState } from "react";
import type { Artist } from "@inkvision/core";
import { updateArtistAction } from "@/server/actions/artist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({ artist }: { artist: Artist }) {
  const action = updateArtistAction.bind(null, artist.id);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="bio" className="eyebrow">
          Biografia
        </Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={artist.bio ?? ""}
          placeholder="Conte sua trajetória, técnica e o que torna seu traço único."
          className="flex w-full rounded-md border border-input bg-background/40 px-3.5 py-2.5 text-sm leading-relaxed transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:border-primary/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="experienceYears" className="eyebrow">
          Anos de experiência
        </Label>
        <Input
          id="experienceYears"
          name="experienceYears"
          type="number"
          min={0}
          defaultValue={artist.experienceYears ?? ""}
          className="font-mono tabular-nums"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="instagram" className="eyebrow">
          Instagram
        </Label>
        <Input id="instagram" name="instagram" defaultValue={artist.instagram ?? ""} placeholder="@usuario" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="avgPrice" className="eyebrow">
          Preço médio
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">
            R$
          </span>
          <Input
            id="avgPrice"
            name="avgPrice"
            type="number"
            min={0}
            step="0.01"
            defaultValue={artist.avgPriceCents ? (artist.avgPriceCents / 100).toFixed(2) : ""}
            className="pl-10 font-mono tabular-nums"
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2.5 self-end text-sm select-none">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={artist.isActive}
          className="size-4 accent-primary"
        />
        Perfil ativo (visível ao público)
      </label>
      <div className="flex items-center gap-4 border-t border-border pt-5 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </Button>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state?.ok && (
          <span className="font-mono text-xs uppercase tracking-widest text-emerald-500">Salvo</span>
        )}
      </div>
    </form>
  );
}
