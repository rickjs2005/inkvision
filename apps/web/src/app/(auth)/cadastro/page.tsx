"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { sanitizeNext, withNext } from "@/lib/sanitize-next";
import { Button } from "@/components/ui/button";
import { Field, PasswordField, SocialButtons, AuthDivider, Benefits, AuthProof } from "@/components/auth/auth-ui";
import { mapAuthError } from "@/components/auth/auth-errors";

const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

export default function CadastroPage() {
  return (
    <Suspense>
      <CadastroPageInner />
    </Suspense>
  );
}

function CadastroPageInner() {
  const router = useRouter();
  // Preserva o destino (ex.: CTA "Simular com X" no perfil do artista) — sem
  // isso, o recém-cadastrado caía no painel genérico e perdia o artista.
  const next = sanitizeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) {
      setError("Para criar sua conta, você precisa concordar com os Termos e a Política de Privacidade.");
      return;
    }
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const { error } = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) return setError(mapAuthError(error, "Não foi possível cadastrar. Tente novamente."));
    router.push(next);
    router.refresh();
  }

  return (
    <div>
      <span className="eyebrow">Ateliê digital · Nova conta</span>
      <h1 className="mt-3 font-display text-4xl font-light tracking-[-0.02em]">Criar conta</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Escolha um artista, veja a arte na sua pele e agende — tudo num só lugar.
      </p>

      <div className="mt-8">
        <SocialButtons />
      </div>
      <div className="my-6">
        <AuthDivider />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field id="name" name="name" label="Nome" icon={User} autoComplete="name" validate={(v) => v.trim().length >= 2} />
        <Field id="email" name="email" type="email" label="E-mail" icon={Mail} autoComplete="email" validate={isEmail} />
        <PasswordField withStrength autoComplete="new-password" />

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-1">
          <Benefits />
        </div>

        <label className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
          />
          <span>
            Li e concordo com os{" "}
            <Link href="/termos" target="_blank" className="ink-link font-medium text-foreground">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" target="_blank" className="ink-link font-medium text-foreground">
              Política de Privacidade
            </Link>
            , incluindo o envio de fotos a um provedor de IA para gerar simulações.
          </span>
        </label>

        <Button type="submit" size="lg" disabled={loading || !agreed} className="mt-2 w-full">
          {loading ? "Criando…" : "Criar conta gratuitamente"}
        </Button>
        <p className="text-center font-mono text-xs text-muted-foreground">
          Sem cartão de crédito <span className="text-primary">·</span> leva menos de 1 minuto
        </p>
      </form>

      <p className="mt-7 text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href={withNext("/login", next)} className="ink-link font-medium text-foreground">
          Entrar
        </Link>
      </p>

      <div className="mt-8">
        <AuthProof />
      </div>
    </div>
  );
}
