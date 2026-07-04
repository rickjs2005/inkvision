import Link from "next/link";
import { TATTOO_STYLES } from "@inkvision/shared";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

export function StyleCategories() {
  return (
    <section id="estilos" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <h2 className="text-center text-3xl font-bold tracking-tight">Explore por estilo</h2>
        <p className="mt-2 text-center text-muted-foreground">
          Do fine line ao realismo — encontre o artista certo para a sua ideia.
        </p>
      </Reveal>
      <RevealStagger className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        {TATTOO_STYLES.map((s) => (
          <RevealItem key={s.slug}>
            <Link
              href={`/tatuadores?estilo=${s.slug}`}
              className="group flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-lg"
            >
              <span className="font-medium">{s.name}</span>
              <span className="text-muted-foreground transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </RevealItem>
        ))}
      </RevealStagger>
    </section>
  );
}
