"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAuthedAction } from "@/server/actions/viewer";
import { Button, type ButtonProps } from "@/components/ui/button";

/**
 * CTA de "comece agora" em página pública estática/ISR (o servidor não pode
 * checar sessão sem virar dinâmica). Renderiza pro `/cadastro` primeiro (SSR
 * e visitante) e troca pro destino já autenticado depois da hidratação, se
 * o viewer já tiver login — sem isso, um usuário logado clicando no CTA
 * principal do perfil de um tatuador/estúdio caía de volta na tela de criar
 * conta, como se nunca tivesse entrado.
 */
export function AuthAwareCta({
  authedHref,
  anonHref,
  size,
  variant,
  className,
  children,
}: {
  authedHref: string;
  anonHref: string;
  children: React.ReactNode;
} & Pick<ButtonProps, "size" | "variant" | "className">) {
  const [href, setHref] = useState(anonHref);

  useEffect(() => {
    let alive = true;
    isAuthedAction()
      .then((authed) => {
        if (alive && authed) setHref(authedHref);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [authedHref]);

  return (
    <Button size={size} variant={variant} className={className} asChild>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
