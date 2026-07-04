"use client";

import { useActionState } from "react";
import { Building2, Mail } from "lucide-react";
import { createStudioAction } from "@/server/actions/studio";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FloatingInput } from "@/components/ui/field";

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

export function CreateStudioForm() {
  const [state, formAction, pending] = useActionState(createStudioAction, null);

  return (
    <form action={formAction} className="grid gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FloatingInput
          id="name"
          name="name"
          label="Nome do estúdio"
          icon={Building2}
          validate={(v) => v.trim().length >= 2}
          required
        />
        <FloatingInput
          id="ownerEmail"
          name="ownerEmail"
          label="E-mail do dono"
          type="email"
          icon={Mail}
          autoComplete="email"
          validate={isEmail}
          required
        />
        <FloatingInput
          id="slug"
          name="slug"
          label="Slug · opcional"
          className="font-mono"
          validate={(v) => /^[a-z0-9-]{2,}$/.test(v.trim())}
        />
        <FloatingInput
          id="description"
          name="description"
          label="Descrição · opcional"
        />
      </div>

      {/* Régua + ação */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <Button type="submit" size="lg" disabled={pending}>
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
