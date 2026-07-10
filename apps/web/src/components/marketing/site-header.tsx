"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/brand/wordmark";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AuthNav } from "./auth-nav";

const NAV = [
  { href: "/simular", label: "Simular" },
  { href: "/tatuadores", label: "Tatuadores" },
  { href: "/estudios", label: "Estúdios" },
];

/** Header com estado de scroll — a moldura se firma ao rolar. */
export function SiteHeader() {
  const { data } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha o menu mobile com Esc e ao voltar para o breakpoint md+.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const mq = window.matchMedia("(min-width: 768px)");
    const onResize = () => {
      if (mq.matches) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onResize);
    };
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/85 shadow-[var(--shadow-ink)] backdrop-blur-2xl backdrop-saturate-150"
          : "border-b border-border/60 bg-background/60 backdrop-blur-xl",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 transition-all duration-300",
          scrolled ? "py-2.5" : "py-4",
        )}
      >
        <Link href="/" aria-label="InkVision — início" className="shrink-0">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="ink-link text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <AuthNav />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            className="ml-1 inline-flex size-9 items-center justify-center rounded-md border border-border text-foreground/80 transition-colors hover:border-primary/50 hover:text-foreground md:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col px-6 py-2">
            {NAV.map((item) => (
              <li key={item.href} className="border-b border-border/60 last:border-b-0">
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {/* AuthNav esconde Entrar/Criar conta abaixo de sm pra evitar overflow —
                esses links precisam ficar acessíveis aqui no menu mobile. */}
            {!data?.user && (
              <>
                <li className="border-b border-border/60 last:border-b-0">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-sm text-muted-foreground transition-colors hover:text-foreground sm:hidden"
                  >
                    Entrar
                  </Link>
                </li>
                <li className="border-b border-border/60 last:border-b-0">
                  <Link
                    href="/cadastro"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-sm font-medium text-foreground sm:hidden"
                  >
                    Criar conta
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
