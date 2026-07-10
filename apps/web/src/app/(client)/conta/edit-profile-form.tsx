"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User as UserIcon, Phone } from "lucide-react";
import { updateUser } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { FloatingInput } from "@/components/ui/field";
import { toast } from "@/components/ui/toaster";

const hasDigits = (min: number) => (v: string) => v.replace(/\D/g, "").length >= min;

export function EditProfileForm({
  name,
  phone,
}: {
  name: string;
  phone: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [nameError, setNameError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError(null);

    const form = new FormData(e.currentTarget);
    const nextName = String(form.get("name") ?? "").trim();
    const nextPhone = String(form.get("phone") ?? "").trim();

    if (nextName.length < 2) {
      setNameError("Informe seu nome completo.");
      return;
    }

    startTransition(async () => {
      // O tipo gerado pelo client do better-auth não conhece `phone` (additionalField
      // definido só no server, sem o plugin inferAdditionalFields); o endpoint aceita
      // qualquer campo em runtime, então seguimos o padrão já usado em auth-ui.tsx
      // (SocialButtons) para contornar essa lacuna de tipagem.
      const { error } = await updateUser({
        name: nextName,
        phone: nextPhone || null,
      } as Parameters<typeof updateUser>[0]);
      if (error) {
        toast.error("Não foi possível atualizar seus dados. Tente novamente.");
        return;
      }
      toast.success("Dados atualizados com sucesso.");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FloatingInput
            id="name"
            name="name"
            label="Nome completo"
            icon={UserIcon}
            defaultValue={name}
            validate={(v) => v.trim().length >= 2}
            required
          />
          {nameError && <p className="mt-1.5 text-sm text-destructive">{nameError}</p>}
        </div>
        <FloatingInput
          id="phone"
          name="phone"
          label="Telefone (opcional)"
          type="tel"
          icon={Phone}
          defaultValue={phone ?? ""}
          validate={hasDigits(10)}
        />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
