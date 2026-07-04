"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/** Botões de auth do header — client-side para o header/Home continuarem estáticos. */
export function AuthNav() {
  const { data, isPending } = useSession();

  if (isPending) {
    return <div className="h-8 w-20 animate-pulse rounded-md bg-muted" aria-hidden />;
  }
  if (data?.user) {
    return (
      <Button size="sm" asChild>
        <Link href="/painel">Painel</Link>
      </Button>
    );
  }
  return (
    <>
      <Button size="sm" variant="ghost" asChild>
        <Link href="/login">Entrar</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/cadastro">Criar conta</Link>
      </Button>
    </>
  );
}
