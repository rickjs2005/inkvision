import Link from "next/link";
import { TATTOO_STYLES } from "@inkvision/shared";
import { Wordmark } from "@/components/brand/wordmark";

const COLUMNS = [
  {
    label: "Plataforma",
    links: [
      { href: "/tatuadores", label: "Tatuadores" },
      { href: "/estudios", label: "Estúdios" },
      { href: "/cadastro", label: "Criar conta" },
    ],
  },
  {
    label: "Estilos",
    links: TATTOO_STYLES.slice(0, 5).map((s) => ({
      href: `/tatuadores?estilo=${s.slug}`,
      label: s.name,
    })),
  },
  {
    label: "Para estúdios",
    links: [
      { href: "/cadastro", label: "Comece grátis" },
      { href: "/login", label: "Entrar" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      {/* Declaração editorial em display, sobreposta à régua. */}
      <div className="mx-auto max-w-6xl px-6 pt-16">
        <p className="max-w-3xl font-display text-3xl leading-[1.1] tracking-[-0.02em] sm:text-[2.6rem]">
          Sua próxima tatuagem,{" "}
          <span className="text-muted-foreground">visualizada antes da agulha.</span>
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Wordmark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Encontre artistas, aprove a arte no chat e veja o resultado na sua própria pele.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.label}>
            <p className="eyebrow mb-4">{col.label}</p>
            <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="ink-link transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-muted-foreground sm:flex-row">
          <span className="font-mono tracking-wide">© {new Date().getFullYear()} INKVISION</span>
          <span className="font-mono tracking-wide">SAAS PARA ESTÚDIOS DE TATUAGEM · FEITO NO BRASIL</span>
        </div>
      </div>
    </footer>
  );
}
