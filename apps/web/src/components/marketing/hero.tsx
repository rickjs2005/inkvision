"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const POPULAR = ["Fine Line", "Blackwork", "Realismo", "Old School"];

export function Hero() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");

  function search(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/tatuadores?q=${encodeURIComponent(query)}` : "/tatuadores");
  }

  const rise = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <LazyMotion features={domAnimation}>
      <section className="relative overflow-hidden border-b border-border">
        {/* halo de tinta atrás, discreto */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full opacity-[0.14] blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
          {/* Coluna editorial (esquerda) */}
          <m.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.09 } } }}
          >
            <m.div variants={rise} className="flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Ateliê digital de tatuagem</span>
            </m.div>

            <m.h1
              variants={rise}
              className="mt-6 font-display text-[3.25rem] font-light leading-[0.98] tracking-[-0.025em] sm:text-7xl"
            >
              Veja a arte
              <br />
              na <span className="italic text-primary">sua pele</span>
              <br />
              antes da agulha.
            </m.h1>

            <m.p
              variants={rise}
              className="mt-7 max-w-md text-[15px] leading-relaxed text-muted-foreground"
            >
              Encontre o artista certo, aprove o desenho no chat e veja a simulação na sua própria
              foto — com IA. Agende e pague num só lugar.
            </m.p>

            {/* Busca editorial — barra baixa, não pílula centralizada */}
            <m.form variants={rise} onSubmit={search} className="mt-9 max-w-md">
              <div className="group flex items-center gap-3 border-b-2 border-foreground/15 pb-2 transition-colors focus-within:border-primary">
                <Search className="size-5 shrink-0 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tatuador, estilo ou estúdio"
                  aria-label="Buscar"
                  className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
                />
                <Button type="submit" size="sm" className="shrink-0">
                  Buscar
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="eyebrow">Popular</span>
                {POPULAR.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => router.push(`/tatuadores?q=${encodeURIComponent(t)}`)}
                    className="ink-link text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </m.form>
          </m.div>

          {/* Espécime de tinta em camadas (direita) */}
          <m.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto hidden aspect-[4/5] w-full max-w-sm lg:block"
          >
            <InkSpecimen reduce={!!reduce} />
          </m.div>
        </div>

        {/* faixa marquee de estilos, contida */}
        <div className="border-t border-border py-3.5">
          <Marquee />
        </div>
      </section>
    </LazyMotion>
  );
}

function InkSpecimen({ reduce }: { reduce: boolean }) {
  const float = reduce
    ? {}
    : { animate: { y: [0, -10, 0] }, transition: { duration: 7, repeat: Infinity, ease: "easeInOut" as const } };
  return (
    <>
      {/* cartão de fundo, deslocado */}
      <div className="absolute right-0 top-6 h-full w-[86%] -rotate-3 rounded-xl border border-border bg-card shadow-[var(--shadow-ink)]" />
      {/* cartão principal — espécime tipográfico */}
      <m.div
        {...float}
        className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-7 shadow-[var(--shadow-lift)]"
      >
        <div className="flex items-start justify-between">
          <span className="eyebrow">Espécime · 01</span>
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Simulação IA
          </span>
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute -left-2 -top-10 select-none font-display text-[10rem] leading-none text-foreground/[0.05]">
            &amp;
          </span>
          <p className="font-display text-6xl italic leading-none">Tinta</p>
          <p className="mt-2 font-display text-6xl leading-none tracking-[-0.02em]">na pele</p>
          {/* pingo de tinta */}
          <span className="mt-5 block h-16 w-px bg-gradient-to-b from-primary to-transparent" />
        </div>

        <div className="flex items-end justify-between border-t border-border pt-4">
          <div className="font-mono text-[11px] leading-relaxed text-muted-foreground">
            <div>REALISMO · FINE LINE</div>
            <div>BLACKWORK · OLD SCHOOL</div>
          </div>
          <ArrowUpRight className="size-5 text-primary" />
        </div>
      </m.div>
    </>
  );
}

const STYLES = [
  "Fine Line", "Blackwork", "Realismo", "Old School", "Aquarela",
  "Geométrico", "Minimalista", "Oriental", "Tribal", "Lettering",
];

function Marquee() {
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <m.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
        className="flex shrink-0 items-center gap-8 pr-8"
      >
        {[...STYLES, ...STYLES].map((s, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">{s}</span>
            <span className="text-primary">✦</span>
          </span>
        ))}
      </m.div>
    </div>
  );
}
