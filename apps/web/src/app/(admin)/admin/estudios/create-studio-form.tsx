"use client";

import { useActionState } from "react";
import { createStudioAction } from "@/server/actions/studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export function CreateStudioForm() {
  const [state, formAction, pending] = useActionState(createStudioAction, null);

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="eyebrow">Nome do estúdio</Label>
          <Input id="name" name="name" required placeholder="Estúdio Alma" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ownerEmail" className="eyebrow">E-mail do dono</Label>
          <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="dona@estudio.com" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="slug" className="eyebrow">Slug · opcional</Label>
          <Input id="slug" name="slug" placeholder="derivado do nome" className="font-mono" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="eyebrow">Descrição · opcional</Label>
          <Input id="description" name="description" placeholder="Blackwork & fine line" />
        </div>
      </div>

      {/* Régua + ação */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Criando…" : "Criar estúdio"}
        </Button>
        {state && !state.ok && (
          <span className="text-sm text-destructive" role="alert">
            {state.error}
          </span>
        )}
        {state?.ok && (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="success">Criado</Badge>
            <span className="font-mono text-foreground">/{state.data.slug}</span>
            <span>· aguardando onboarding do dono</span>
          </span>
        )}
      </div>
    </form>
  );
}
