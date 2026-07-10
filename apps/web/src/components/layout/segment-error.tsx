"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Error boundary dos grupos autenticados — renderiza DENTRO do layout do
 * grupo, então o AppHeader (sessão, Sair) continua de pé. Sem isto, qualquer
 * erro de runtime subia pro error.tsx da raiz e derrubava o chrome inteiro.
 */
export function SegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-start px-6 py-20">
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-destructive" />
        <span className="eyebrow text-destructive">Algo deu errado</span>
      </div>
      <h1 className="mt-5 font-display text-4xl font-light leading-[0.95] tracking-[-0.025em]">
        Não conseguimos carregar esta página
      </h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Foi um erro nosso, não seu. Tente de novo — se continuar, volte ao painel e tente mais
        tarde.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/70">Ref: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => reset()}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link href="/painel">Ir para o painel</Link>
        </Button>
      </div>
    </div>
  );
}
