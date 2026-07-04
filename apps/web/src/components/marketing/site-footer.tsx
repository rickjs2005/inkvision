import Link from "next/link";
import { TATTOO_STYLES } from "@inkvision/shared";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold">◈ InkVision</p>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Encontre artistas, aprove a arte e veja sua tatuagem na própria pele antes da agulha.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Plataforma</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li><Link href="/tatuadores" className="hover:text-foreground">Tatuadores</Link></li>
            <li><Link href="/estudios" className="hover:text-foreground">Estúdios</Link></li>
            <li><Link href="/cadastro" className="hover:text-foreground">Criar conta</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Estilos</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {TATTOO_STYLES.slice(0, 5).map((s) => (
              <li key={s.slug}>
                <Link href={`/tatuadores?estilo=${s.slug}`} className="hover:text-foreground">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Para estúdios</p>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li><Link href="/cadastro" className="hover:text-foreground">Comece grátis</Link></li>
            <li><Link href="/login" className="hover:text-foreground">Entrar</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © InkVision · SaaS para estúdios de tatuagem
      </div>
    </footer>
  );
}
