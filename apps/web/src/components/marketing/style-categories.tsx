import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TATTOO_STYLES } from "@inkvision/shared";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

export function StyleCategories() {
  return (
    <section id="estilos" className="mx-auto max-w-6xl px-6 py-24">
      {/* Cabeçalho editorial, alinhado à esquerda */}
      <Reveal>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">O que você procura</span>
            </div>
            <h2 className="mt-6 font-display text-4xl font-light leading-[1.0] tracking-[-0.02em] sm:text-5xl">
              Estilos
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground lg:justify-self-end lg:text-right">
            Do fine line ao realismo — nove linguagens de traço, cada uma com os
            artistas certos para a sua ideia.
          </p>
        </div>
      </Reveal>

      {/* Índice editorial com hairlines */}
      <RevealStagger className="mt-14 border-t border-border">
        {TATTOO_STYLES.map((s, i) => (
          <RevealItem key={s.slug}>
            <Link
              href={`/tatuadores?estilo=${s.slug}`}
              className="group grid grid-cols-[auto_1fr_auto] items-baseline gap-5 border-b border-border py-6 transition-colors hover:bg-muted/40 sm:gap-8 sm:py-7"
            >
              <span className="font-mono text-xs tabular-nums text-muted-foreground transition-colors group-hover:text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-2xl font-light tracking-[-0.01em] transition-transform duration-300 group-hover:translate-x-1.5 sm:text-3xl">
                {s.name}
              </span>
              <ArrowUpRight className="size-5 translate-y-0.5 text-muted-foreground opacity-0 transition-all duration-300 group-hover:-translate-y-0 group-hover:text-primary group-hover:opacity-100" />
            </Link>
          </RevealItem>
        ))}
      </RevealStagger>
    </section>
  );
}
