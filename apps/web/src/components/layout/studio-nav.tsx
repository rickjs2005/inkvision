import Link from "next/link";

const SECTIONS = [
  { slug: "pedidos", label: "Pedidos" },
  { slug: "tatuadores", label: "Tatuadores" },
  { slug: "planos", label: "Planos" },
] as const;

/**
 * Subnavegação das páginas do estúdio — sem ela, cada seção era um beco:
 * a única volta era o logo (→ /painel) e trocar de seção exigia dois saltos.
 */
export function StudioNav({
  studioId,
  current,
}: {
  studioId: string;
  current: (typeof SECTIONS)[number]["slug"];
}) {
  return (
    <nav aria-label="Seções do estúdio" className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
      {SECTIONS.map((s) =>
        s.slug === current ? (
          <span
            key={s.slug}
            aria-current="page"
            className="font-mono text-xs uppercase tracking-widest text-primary"
          >
            {s.label}
          </span>
        ) : (
          <Link
            key={s.slug}
            href={`/estudio/${studioId}/${s.slug}`}
            className="ink-link font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            {s.label}
          </Link>
        ),
      )}
    </nav>
  );
}
