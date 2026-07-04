"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Phone, MapPin, Building2, Hash, Map } from "lucide-react";
import { completeOnboardingAction } from "@/server/actions/studio";
import type { ActionResult } from "@/server/action-result";
import { Button } from "@/components/ui/button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/field";

const hasDigits = (min: number) => (v: string) => v.replace(/\D/g, "").length >= min;

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
        <span className="eyebrow pt-4 text-muted-foreground">Identidade</span>
        <FloatingInput
          id="name"
          name="name"
          label="Nome do estúdio"
          icon={Building2}
          defaultValue={defaultName}
          validate={(v) => v.trim().length >= 2}
          required
        />
      </fieldset>

      <div className="border-t border-border" />

      {/* Contato */}
      <fieldset className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <span className="eyebrow pt-4 text-muted-foreground">Contato</span>
        <FloatingInput
          id="phone"
          name="phone"
          label="Telefone"
          type="tel"
          icon={Phone}
          validate={hasDigits(10)}
          required
        />
      </fieldset>

      <div className="border-t border-border" />

      {/* Endereço */}
      <fieldset className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <span className="eyebrow pt-4 text-muted-foreground">Endereço</span>
        <div className="grid gap-4 sm:grid-cols-2">
          <FloatingInput id="city" name="city" label="Cidade" icon={MapPin} validate={(v) => v.trim().length >= 2} />
          <FloatingInput id="state" name="state" label="Estado (UF)" icon={Map} validate={(v) => /^[A-Za-z]{2}$/.test(v.trim())} />
          <FloatingInput id="zip" name="zip" label="CEP" icon={Hash} validate={hasDigits(8)} />
          <div className="sm:col-span-2">
            <FloatingInput id="street" name="street" label="Logradouro" icon={MapPin} validate={(v) => v.trim().length >= 3} />
          </div>
        </div>
      </fieldset>

      <div className="border-t border-border" />

      {/* Sobre */}
      <fieldset className="grid gap-6 sm:grid-cols-[10rem_1fr]">
        <span className="eyebrow pt-4 text-muted-foreground">Sobre</span>
        <FloatingTextarea
          id="description"
          name="description"
          label="Especialidades, estilo do estúdio…"
          rows={5}
        />
      </fieldset>

      <div className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        {state && !state.ok ? (
          <span className="text-sm text-destructive" role="alert">{state.error}</span>
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
