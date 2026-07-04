"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboardingAction } from "@/server/actions/studio";
import type { ActionResult } from "@/server/action-result";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm({ studioId, defaultName }: { studioId: string; defaultName: string }) {
  const router = useRouter();
  const action = async (prev: ActionResult | null, formData: FormData) => {
    const res = await completeOnboardingAction(studioId, prev, formData);
    if (res.ok) router.push("/painel");
    return res;
  };
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="flex flex-col gap-12">
      {/* Identidade */}
      <fieldset className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <span className="eyebrow pt-2.5 text-muted-foreground">Identidade</span>
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome do estúdio</Label>
          <Input id="name" name="name" defaultValue={defaultName} required />
        </div>
      </fieldset>

      <div className="border-t border-border" />

      {/* Contato */}
      <fieldset className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <span className="eyebrow pt-2.5 text-muted-foreground">Contato</span>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" name="phone" required placeholder="(33) 99999-9999" />
        </div>
      </fieldset>

      <div className="border-t border-border" />

      {/* Endereço */}
      <fieldset className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <span className="eyebrow pt-2.5 text-muted-foreground">Endereço</span>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" name="city" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="state">Estado</Label>
            <Input id="state" name="state" placeholder="MG" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="zip">CEP</Label>
            <Input id="zip" name="zip" />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="street">Logradouro</Label>
            <Input id="street" name="street" />
          </div>
        </div>
      </fieldset>

      <div className="border-t border-border" />

      {/* Sobre */}
      <fieldset className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <span className="eyebrow pt-2.5 text-muted-foreground">Sobre</span>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" placeholder="Especialidades, estilo do estúdio…" />
        </div>
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        {state && !state.ok ? (
          <span className="text-sm text-destructive">{state.error}</span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">
            Você poderá editar tudo depois.
          </span>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Salvando…" : "Publicar estúdio"}
        </Button>
      </div>
    </form>
  );
}
