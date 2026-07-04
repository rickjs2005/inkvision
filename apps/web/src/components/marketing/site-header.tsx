"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/brand/wordmark";
import { cn } from "@/lib/utils";
import { AuthNav } from "./auth-nav";

const NAV = [
  { href: "/simular", label: "Simular" },
  { href: "/tatuadores", label: "Tatuadores" },
  { href: "/estudios", label: "Estúdios" },
];

/** Header com estado de scroll — a moldura se firma ao rolar. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        </div>
      </div>
    </header>
  );
}
