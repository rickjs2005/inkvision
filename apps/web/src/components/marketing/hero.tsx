"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSimulation } from "./hero-simulation";

const FEATURES = ["Simulação IA", "Chat com o artista", "Aprovação da arte", "Agendamento"];

const ARTISTS = [
  { initials: "RC", name: "Rafa Costa", meta: "Fine line · ★ 4.9" },
  { initials: "AB", name: "Ana Black", meta: "Blackwork · ★ 5.0" },
  { initials: "LF", name: "Lucas Faria", meta: "Realismo · ★ 4.8" },
];

const STATS = [
  { value: "12.000+", label: "simulações geradas" },
  { value: "140", label: "estúdios ativos" },
  { value: "4.9★", label: "320 avaliações" },
];

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

  // Marketplace "vivo": o artista em destaque troca a cada ~3.2s.
  const [artistIdx, setArtistIdx] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setArtistIdx((i) => (i + 1) % ARTISTS.length), 3200);
    return () => clearInterval(id);
  }, [reduce]);
  const artist = ARTISTS[artistIdx]!;

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
              className="mt-6 font-display text-[3.3rem] font-light leading-[0.9] tracking-[-0.03em] sm:text-7xl"
            >
              Veja a arte
              <br />
              na <span className="italic text-primary">sua pele</span>
              <br />
              antes da agulha.
            </m.h1>

            <m.p variants={rise} className="mt-7 max-w-md text-[15px] leading-relaxed text-muted-foreground">
              Escolha um artista, aprove o desenho no chat e veja exatamente como a tatuagem vai
              ficar na sua pele — antes da primeira sessão.
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
            <m.div variants={rise} className="mt-9">
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="group/cta">
                  <Link href="/simular">
                    <Sparkles className="transition-transform group-hover/cta:rotate-12" />
                    Simular minha tatuagem
                    <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/tatuadores">Ver tatuadores</Link>
                </Button>
              </div>
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                Grátis <span className="text-primary">·</span> leva menos de 1 minuto
              </p>
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
                <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                  ↵
                </kbd>
                <Button type="submit" size="sm" variant="ink" aria-label="Buscar">
                  <Search />
                </Button>
              </form>
            </m.div>

            {/* Prova social — números de autoridade */}
            <m.dl variants={rise} className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-7">
              {STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-display text-3xl leading-none tracking-tight sm:text-4xl">{s.value}</dt>
                  <dd className="mt-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </dd>
                </div>
              ))}
            </m.dl>
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
            {/* chip de artista ROTATIVO — marketplace vivo, saindo da moldura */}
            <div className="absolute -bottom-5 -left-7 flex h-[68px] w-64 items-center overflow-hidden rounded-md border border-border bg-background px-3.5 shadow-[var(--shadow-lift)]">
              <AnimatePresence mode="wait">
                <m.div
                  key={artist.name}
                  initial={reduce ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center gap-3"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-foreground font-display text-sm text-background">
                    {artist.initials}
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-medium">{artist.name}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {artist.meta}
                    </p>
                  </div>
                </m.div>
              </AnimatePresence>
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
