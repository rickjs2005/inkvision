"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSimulation } from "./hero-simulation";

const FEATURES = ["Simulação IA", "Chat com o artista", "Aprovação da arte", "Agendamento"];

const MODES = [
  { key: "tatuador", label: "Tatuador", placeholder: "Nome do tatuador ou estilo" },
  { key: "estudio", label: "Estúdio", placeholder: "Nome do estúdio" },
  { key: "estilo", label: "Estilo", placeholder: "Fine line, blackwork, realismo…" },
  { key: "cidade", label: "Cidade", placeholder: "Sua cidade" },
] as const;

export function Hero() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<(typeof MODES)[number]["key"]>("tatuador");
  const [q, setQ] = useState("");
  const active = MODES.find((x) => x.key === mode)!;

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
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 -z-10 h-[560px] w-[560px] rounded-full opacity-[0.16] blur-3xl"
          style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
        />

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
          {/* ─────────── Coluna editorial ─────────── */}
          <m.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.09 } } }}>
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

            <m.p variants={rise} className="mt-7 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Envie uma foto do seu corpo e a IA aplica o desenho na sua pele — perspectiva, luz e
              sombra. Encontre o artista, aprove a arte no chat, agende e pague num só lugar.
            </m.p>

            {/* Diferenciais do marketplace */}
            <m.ul variants={rise} className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {FEATURES.map((f) => (
                <li key={f} className="inline-flex items-center gap-1.5 text-sm text-foreground/80">
                  <Check className="size-3.5 text-primary" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </m.ul>

            {/* CTA dominante */}
            <m.div variants={rise} className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="group/cta">
                <Link href="/cadastro">
                  <Sparkles className="transition-transform group-hover/cta:rotate-12" />
                  Simular minha tatuagem
                  <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/tatuadores">Ver tatuadores</Link>
              </Button>
            </m.div>

            {/* Busca inteligente segmentada */}
            <m.div variants={rise} className="mt-8 max-w-md">
              <div className="flex flex-wrap gap-1">
                {MODES.map((mo) => (
                  <button
                    key={mo.key}
                    type="button"
                    onClick={() => setMode(mo.key)}
                    className={`rounded-t-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors ${
                      mode === mo.key
                        ? "border border-b-0 border-border bg-card text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mo.label}
                  </button>
                ))}
              </div>
              <form
                onSubmit={search}
                className="flex items-center gap-2 rounded-md rounded-tl-none border border-border bg-card p-2 shadow-[var(--shadow-ink)] transition-colors focus-within:border-primary/50"
              >
                <Search className="ml-1.5 size-4 shrink-0 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={active.placeholder}
                  aria-label={`Buscar ${active.label}`}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                />
                <Button type="submit" size="sm" variant="ink" aria-label="Buscar">
                  <Search />
                </Button>
              </form>
            </m.div>

            {/* Prova social */}
            <m.div
              variants={rise}
              className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-xs text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="text-primary">★</span> 4.9 · 320 avaliações
              </span>
              <span className="h-3 w-px bg-border" />
              <span>+2.400 simulações geradas</span>
              <span className="h-3 w-px bg-border" />
              <span>120 estúdios</span>
            </m.div>
          </m.div>

          {/* ─────────── Demonstração viva (direita) ─────────── */}
          <m.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto hidden w-full max-w-md lg:block"
          >
            {/* cartão-sombra atrás, para profundidade */}
            <div className="absolute -right-6 top-8 -z-10 h-full w-full -rotate-3 rounded-2xl border border-border bg-card/60 shadow-[var(--shadow-ink)]" />
            <HeroSimulation />
            {/* chip de artista — elemento humano/marketplace saindo da moldura */}
            <div className="absolute -bottom-5 -left-7 flex items-center gap-3 rounded-md border border-border bg-background px-3.5 py-2.5 shadow-[var(--shadow-lift)]">
              <span className="flex size-9 items-center justify-center rounded-full bg-foreground font-display text-sm text-background">
                RC
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">Rafa Costa</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Fine line · ★ 4.9
                </p>
              </div>
            </div>
          </m.div>
        </div>

        <div className="border-t border-border py-3.5">
          <Marquee reduce={!!reduce} />
        </div>
      </section>
    </LazyMotion>
  );
}

const STYLES = [
  "Fine Line", "Blackwork", "Realismo", "Old School", "Aquarela",
  "Geométrico", "Minimalista", "Oriental", "Tribal", "Lettering",
];

function Marquee({ reduce }: { reduce: boolean }) {
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <m.div
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={reduce ? undefined : { duration: 32, repeat: Infinity, ease: "linear" }}
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
