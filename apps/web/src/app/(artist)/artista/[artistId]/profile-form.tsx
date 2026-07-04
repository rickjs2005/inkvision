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
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="bio">Biografia</Label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={artist.bio ?? ""}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="experienceYears">Anos de experiência</Label>
        <Input
          id="experienceYears"
          name="experienceYears"
          type="number"
          min={0}
          defaultValue={artist.experienceYears ?? ""}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="instagram">Instagram</Label>
        <Input id="instagram" name="instagram" defaultValue={artist.instagram ?? ""} placeholder="@usuario" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="avgPrice">Preço médio (R$)</Label>
        <Input
          id="avgPrice"
          name="avgPrice"
          type="number"
          min={0}
          step="0.01"
          defaultValue={artist.avgPriceCents ? (artist.avgPriceCents / 100).toFixed(2) : ""}
        />
      </div>
      <label className="flex items-center gap-2 self-end text-sm">
        <input type="checkbox" name="isActive" defaultChecked={artist.isActive} className="size-4" />
        Perfil ativo (visível ao público)
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </Button>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state?.ok && <span className="text-sm text-emerald-500">Salvo.</span>}
      </div>
    </form>
  );
}
