import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "@/components/brand/wordmark";
import { AuthNav } from "./auth-nav";

const NAV = [
  { href: "/tatuadores", label: "Tatuadores" },
  { href: "/estudios", label: "Estúdios" },
  { href: "/#estilos", label: "Estilos" },
];

/** Header estático — o estado de auth hidrata via <AuthNav/> (client). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/72 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
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
