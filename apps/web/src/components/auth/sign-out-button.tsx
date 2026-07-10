"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Ação de logout — usada em toda página autenticada (painel, conta). */
export function SignOutButton({
  variant = "outline",
  size = "sm",
  className,
}: Pick<ButtonProps, "variant" | "size" | "className">) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      variant={variant}
      size={size}
      // "sm" tem 36px de altura — abaixo do mínimo de 44pt recomendado pra uma
      // ação crítica (logout) em touch. Fixamos o piso só no mobile; do sm+
      // pra cima o tamanho passado pelo caller continua valendo como hoje.
      className={cn("min-h-11 sm:min-h-0", className)}
      onClick={handleSignOut}
      disabled={loading}
    >
      <LogOut />
      {loading ? "Saindo…" : "Sair"}
    </Button>
  );
}
