"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function MockCheckoutError({
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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold text-destructive">Não foi possível carregar o pagamento</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Nada foi cobrado — tente novamente. Se o problema continuar, feche esta página e acesse o
        pagamento novamente a partir do seu pedido.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground/70">Ref: {error.digest}</p>
      )}
      <Button className="mt-8" onClick={() => reset()}>
        Tentar novamente
      </Button>
    </div>
  );
}
