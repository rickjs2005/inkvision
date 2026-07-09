"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Field, PasswordField, SocialButtons, AuthDivider, AuthProof } from "@/components/auth/auth-ui";
import { mapAuthError } from "@/components/auth/auth-errors";

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const { error } = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) return setError(mapAuthError(error, "Erro no servidor. Tente novamente em instantes."));
    router.push("/painel");
    router.refresh();
  }

  return (
    <div>
      <span className="eyebrow">Ateliê digital · Acesso</span>
      <h1 className="mt-3 font-display text-4xl font-light tracking-[-0.02em]">Bem-vindo de volta</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">Acesse sua conta InkVision.</p>

      <div className="mt-8">
        <SocialButtons />
      </div>
      <div className="my-6">
        <AuthDivider />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field id="email" name="email" type="email" label="E-mail" icon={Mail} autoComplete="email" validate={isEmail} />
        <PasswordField autoComplete="current-password" />

        <Link href="/esqueci-senha" className="ink-link -mt-1 self-end text-sm text-muted-foreground">
          Esqueceu sua senha?
        </Link>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="mt-2 w-full">
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="mt-7 text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link href="/cadastro" className="ink-link font-medium text-foreground">
          Cadastre-se grátis
        </Link>
      </p>

      <div className="mt-8">
        <AuthProof />
      </div>
    </div>
  );
}
