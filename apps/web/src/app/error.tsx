"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Error({
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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="text-2xl font-bold tracking-tight">
        <span className="text-primary">◈</span> InkVision
      </div>
      <h1 className="mt-8 text-2xl font-bold text-destructive">Algo deu errado</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Ocorreu um erro inesperado ao carregar esta página. Você pode tentar novamente ou voltar
        para o início.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/70">Ref: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => reset()}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link href="/">Voltar para o início</Link>
        </Button>
      </div>
    </main>
  );
}
