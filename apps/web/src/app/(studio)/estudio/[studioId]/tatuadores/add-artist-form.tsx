"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { addArtistAction } from "@/server/actions/artist";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/field";

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

export function AddArtistForm({ studioId }: { studioId: string }) {
  const action = addArtistAction.bind(null, studioId);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <FloatingInput
            id="email"
            name="email"
            label="E-mail do tatuador (conta existente)"
            type="email"
            icon={Mail}
            autoComplete="email"
            validate={isEmail}
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={pending} className="sm:h-14">
          {pending ? "Adicionando…" : "Adicionar"}
        </Button>
      </div>
      {state && !state.ok && (
        <p className="font-mono text-xs text-destructive" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="font-mono text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Tatuador adicionado.
        </p>
      )}
    </form>
  );
}
