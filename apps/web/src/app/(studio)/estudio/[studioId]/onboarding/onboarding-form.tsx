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
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="name">Nome do estúdio</Label>
        <Input id="name" name="name" defaultValue={defaultName} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" required placeholder="(33) 99999-9999" />
      </div>
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
        <Label htmlFor="street">Endereço</Label>
        <Input id="street" name="street" />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="description">Descrição</Label>
        <Input id="description" name="description" placeholder="Especialidades, estilo do estúdio…" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Publicar estúdio"}
        </Button>
        {state && !state.ok && <span className="text-sm text-destructive">{state.error}</span>}
      </div>
    </form>
  );
}
