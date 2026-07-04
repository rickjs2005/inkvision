"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CadastroPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const { error } = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) return setError(error.message ?? "Não foi possível cadastrar.");
    router.push("/painel");
    router.refresh();
  }

  return (
    <div>
      <span className="eyebrow">Ateliê digital · Nova conta</span>
      <h1 className="mt-3 font-display text-4xl font-light tracking-[-0.02em]">Criar conta</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Comece seu projeto de tatuagem na InkVision.
      </p>

      <form onSubmit={onSubmit} className="mt-9 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nome</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="Seu nome"
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="email">E-mail</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="voce@email.com"
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="pl-10"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Criando…" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-8 text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="ink-link font-medium text-foreground">
          Entrar
        </Link>
      </p>
    </div>
  );
}
