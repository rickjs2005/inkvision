"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button, type ButtonProps } from "@/components/ui/button";

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
    <Button variant={variant} size={size} className={className} onClick={handleSignOut} disabled={loading}>
      <LogOut />
      {loading ? "Saindo…" : "Sair"}
    </Button>
  );
}
