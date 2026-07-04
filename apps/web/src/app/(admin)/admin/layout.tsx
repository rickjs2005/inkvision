import Link from "next/link";
import { requirePlatformAdmin } from "@/server/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="font-bold">◈ InkVision Admin</span>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground">
                Dashboard
              </Link>
              <Link href="/admin/estudios" className="hover:text-foreground">
                Estúdios
              </Link>
              <Link href="/admin/logs" className="hover:text-foreground">
                Logs
              </Link>
            </nav>
          </div>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
