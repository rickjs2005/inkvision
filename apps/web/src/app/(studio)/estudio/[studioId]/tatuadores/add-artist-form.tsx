"use client";

import { useActionState } from "react";
import { addArtistAction } from "@/server/actions/artist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddArtistForm({ studioId }: { studioId: string }) {
  const action = addArtistAction.bind(null, studioId);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2">
        <Label htmlFor="email">E-mail do tatuador (conta existente)</Label>
        <Input id="email" name="email" type="email" required placeholder="tatuador@email.com" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adicionando…" : "Adicionar"}
      </Button>
      {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
      {state?.ok && <span className="text-sm text-emerald-500">Tatuador adicionado.</span>}
    </form>
  );
}
