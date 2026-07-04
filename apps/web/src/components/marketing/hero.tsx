"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [q, setQ] = useState("");

  function search(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/tatuadores?q=${encodeURIComponent(query)}` : "/tatuadores");
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };
  const item = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
  };

  return (
    <LazyMotion features={domAnimation}>
    <section className="relative overflow-hidden">
      {/* brilho de fundo */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-10%] -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
      />
      <m.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32"
      >
        <m.div variants={item} className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            Simulação da tatuagem na sua pele com IA
          </span>
        </m.div>

        <m.h1
          variants={item}
          className="text-balance text-5xl font-bold tracking-tight sm:text-7xl"
        >
          Sua próxima tatuagem,{" "}
          <span className="bg-gradient-to-r from-primary to-fuchsia-400 bg-clip-text text-transparent">
            visualizada antes da agulha
          </span>
        </m.h1>

        <m.p variants={item} className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Encontre artistas, aprove a arte no chat e veja o resultado na sua própria foto. Agende e
          pague num só lugar.
        </m.p>

        <m.form
          variants={item}
          onSubmit={search}
          className="mx-auto mt-10 flex max-w-lg items-center gap-2 rounded-full border border-border bg-card p-2 shadow-lg"
        >
          <Search className="ml-3 size-5 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar tatuador, estilo ou estúdio…"
            className="flex-1 bg-transparent px-1 text-sm outline-none"
            aria-label="Buscar"
          />
          <Button type="submit" className="rounded-full">
            Buscar
          </Button>
        </m.form>

        <m.div variants={item} className="mt-6 text-sm text-muted-foreground">
          Populares:{" "}
          {["Fine Line", "Blackwork", "Realismo"].map((t, i) => (
            <span key={t}>
              {i > 0 && " · "}
              <button
                onClick={() => router.push(`/tatuadores?q=${encodeURIComponent(t)}`)}
                className="hover:text-foreground"
              >
                {t}
              </button>
            </span>
          ))}
        </m.div>
      </m.div>
    </section>
    </LazyMotion>
  );
}
