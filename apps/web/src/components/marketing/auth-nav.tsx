"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Botões de auth do header — client-side para o header/Home continuarem estáticos. */
export function AuthNav() {
  const { data, isPending } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (isPending) {
    return <div className="h-8 w-20 animate-pulse rounded-md bg-muted" aria-hidden />;
  }

  if (data?.user) {
    const user = data.user;
    // Cargo de estúdio (dono/tatuador) exige checar StudioMember no banco —
    // a sessão client-side não carrega isso. Aqui só distinguimos admin da
    // plataforma; qualquer outro papel aparece como "Cliente" no header de
    // marketing (o dashboard em /painel mostra o papel real).
    const platformRole = (user as { platformRole?: string }).platformRole;
    const roleLabel = platformRole === "ADMIN" ? "Admin" : "Cliente";

    async function handleSignOut() {
      setSigningOut(true);
      await signOut();
      setOpen(false);
      router.push("/");
      router.refresh();
    }

    return (
      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-sm transition-colors hover:border-border hover:bg-foreground/[0.04]"
        >
          <span className="max-w-[12ch] truncate">{user.name}</span>
          <Badge variant="neutral">{roleLabel}</Badge>
          <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-44 rounded-md border border-border bg-background py-1.5 shadow-[var(--shadow-lift)]"
          >
            <Link
              href="/painel"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
            >
              Painel
            </Link>
            <Link
              href="/conta"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
            >
              Conta
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/[0.08] disabled:opacity-50"
            >
              <LogOut className="size-3.5" />
              {signingOut ? "Saindo…" : "Sair"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <Button size="sm" variant="ghost" asChild>
        <Link href="/login">Entrar</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/cadastro">Criar conta</Link>
      </Button>
    </div>
  );
}
