"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/auth/auth-ui";
import { mapAuthError } from "@/components/auth/auth-errors";
import { toast } from "@/components/ui/toaster";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const { error } = await resetPassword({
      newPassword: String(form.get("password")),
      token,
    });
    setLoading(false);
    if (error) return setError(mapAuthError(error, "Não foi possível redefinir sua senha. Tente novamente."));
    toast.success("Senha redefinida. Você já pode entrar.");
    router.push("/login");
  }

  if (!token) {
    return (
      <div>
        <span className="eyebrow">Ateliê digital · Recuperação</span>
        <h1 className="mt-3 font-display text-4xl font-light tracking-[-0.02em]">Link inválido</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Esse link de redefinição é inválido ou expirou. Peça um novo.
        </p>
        <p className="mt-7 text-sm text-muted-foreground">
          <Link href="/esqueci-senha" className="ink-link font-medium text-foreground">
            Pedir novo link
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <span className="eyebrow">Ateliê digital · Recuperação</span>
      <h1 className="mt-3 font-display text-4xl font-light tracking-[-0.02em]">Nova senha</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Escolha uma nova senha para sua conta.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <PasswordField withStrength autoComplete="new-password" />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </form>
    </div>
  );
}
