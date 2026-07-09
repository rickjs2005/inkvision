"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/auth/auth-ui";
import { mapAuthError } from "@/components/auth/auth-errors";

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

export default function EsqueciSenhaPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const { error } = await requestPasswordReset({
      email: String(form.get("email")),
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);
    if (error) return setError(mapAuthError(error, "Não foi possível enviar o e-mail. Tente novamente."));
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <span className="eyebrow">Ateliê digital · Recuperação</span>
        <h1 className="mt-3 font-display text-4xl font-light tracking-[-0.02em]">Verifique seu e-mail</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Se esse e-mail existir na nossa base, você vai receber um link para redefinir sua senha em poucos
          minutos.
        </p>
        <p className="mt-7 text-sm text-muted-foreground">
          <Link href="/login" className="ink-link font-medium text-foreground">
            Voltar para o login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <span className="eyebrow">Ateliê digital · Recuperação</span>
      <h1 className="mt-3 font-display text-4xl font-light tracking-[-0.02em]">Esqueceu sua senha?</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Digite seu e-mail e enviamos um link para você criar uma nova senha.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <Field id="email" name="email" type="email" label="E-mail" icon={Mail} autoComplete="email" validate={isEmail} />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading ? "Enviando…" : "Enviar link de redefinição"}
        </Button>
      </form>

      <p className="mt-7 text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href="/login" className="ink-link font-medium text-foreground">
          Entrar
        </Link>
      </p>
    </div>
  );
}
