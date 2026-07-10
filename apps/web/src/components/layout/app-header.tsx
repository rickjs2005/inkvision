import Link from "next/link";
import type { Actor } from "@inkvision/core";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

type Role = "ADMIN" | "OWNER" | "ARTIST" | "CLIENT";

const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Admin",
  OWNER: "Dono",
  ARTIST: "Tatuador",
  CLIENT: "Cliente",
};

/** Papel de maior peso do ator — mesma regra do painel (ver (client)/painel/page.tsx). */
function resolveRole(actor: Actor): Role {
  if (actor.platformRole === "ADMIN") return "ADMIN";
  const roles = actor.memberships.map((m) => m.role);
  if (roles.some((r) => r === "OWNER" || r === "MANAGER")) return "OWNER";
  if (roles.includes("ARTIST")) return "ARTIST";
  return "CLIENT";
}

/**
 * Moldura de app compartilhada pelos grupos autenticados ((client), (artist),
 * (studio)) — sem ela essas páginas não tinham header, indicação de sessão
 * nem forma de sair. Server Component: recebe o actor/nome já resolvidos
 * pelo layout (requireActor() + getCurrentUser()).
 */
export function AppHeader({ actor, userName }: { actor: Actor; userName: string | null }) {
  const role = resolveRole(actor);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/painel" aria-label="InkVision — painel" className="flex items-center gap-1.5 font-display text-lg leading-none">
          <span className="text-primary">◈</span>
          InkVision
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 sm:flex">
            {userName && <span className="max-w-[14ch] truncate text-sm text-muted-foreground">{userName}</span>}
            <Badge variant="neutral">{ROLE_LABEL[role]}</Badge>
          </div>
          <nav className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/painel">Painel</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/conta">Conta</Link>
            </Button>
            <SignOutButton />
          </nav>
        </div>
      </div>
    </header>
  );
}
