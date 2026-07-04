"use client";

import { useActionState } from "react";
import { createStudioAction } from "@/server/actions/studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateStudioForm() {
  const [state, formAction, pending] = useActionState(createStudioAction, null);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome do estúdio</Label>
        <Input id="name" name="name" required placeholder="Estúdio Alma" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ownerEmail">E-mail do dono</Label>
        <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="dona@estudio.com" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Slug (opcional)</Label>
        <Input id="slug" name="slug" placeholder="derivado do nome" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Descrição (opcional)</Label>
        <Input id="description" name="description" placeholder="Blackwork & fine line" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando…" : "Criar estúdio"}
        </Button>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
        {state?.ok && (
          <span className="text-sm text-emerald-500">
            Criado: /{state.data.slug} (aguardando onboarding do dono)
          </span>
        )}
      </div>
    </form>
  );
}
