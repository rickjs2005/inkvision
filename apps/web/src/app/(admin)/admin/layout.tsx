import Link from "next/link";
import { requirePlatformAdmin } from "@/server/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/estudios", label: "Estúdios" },
  { href: "/admin/logs", label: "Logs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="group flex flex-col leading-none">
              <span className="eyebrow">Administração</span>
              <span className="mt-1.5 flex items-center gap-1.5 font-display text-lg leading-none">
                <span className="text-primary">◈</span>
                InkVision
              </span>
            </Link>
            <nav className="hidden items-center gap-6 sm:flex">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="ink-link text-sm text-muted-foreground hover:text-foreground"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/painel">Voltar ao painel</Link>
            </Button>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
        <nav className="flex items-center gap-6 border-t border-border px-6 py-3 sm:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="ink-link text-sm text-muted-foreground hover:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
