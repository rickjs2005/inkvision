import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthNav } from "./auth-nav";

/** Server component estático — o estado de auth hidrata via <AuthNav/> (client). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ◈ InkVision
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <Link href="/tatuadores" className="transition-colors hover:text-foreground">
            Tatuadores
          </Link>
          <Link href="/estudios" className="transition-colors hover:text-foreground">
            Estúdios
          </Link>
          <Link href="/#estilos" className="transition-colors hover:text-foreground">
            Estilos
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
