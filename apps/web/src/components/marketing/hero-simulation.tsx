"use client";

import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

/**
 * Demonstração viva do produto no hero: uma "pele" recebe a arte via IA —
 * detecção → desenho da tatuagem (traço a traço) → resultado, em loop de ~8s.
 * Tudo self-contained (sem imagem externa): pele em gradiente quente, tinta na
 * cor foreground, acentos técnicos em vermelhão. Respeita prefers-reduced-motion.
 */
const LOOP = 8; // segundos

export function HeroSimulation() {
  const reduce = useReducedMotion();

  // Em reduced-motion: estado final estático (tatuagem aplicada), sem loop.
  const drawn = reduce
    ? { pathLength: 1, opacity: 1 }
    : {
        pathLength: [0, 0, 1, 1, 0],
        opacity: [0, 0, 1, 1, 0],
        transition: { duration: LOOP, times: [0, 0.28, 0.62, 0.86, 1], repeat: Infinity, ease: "easeInOut" as const },
      };

  // Loop de opacidade sincronizado com o ciclo de 8s (undefined em reduced-motion).
  const fade = (keyframes: number[], times: number[]) =>
    reduce
      ? undefined
      : {
          animate: { opacity: keyframes },
          transition: { duration: LOOP, times, repeat: Infinity, ease: "easeInOut" as const },
        };

  return (
    <LazyMotion features={domAnimation}>
      <figure
        aria-label="Demonstração: a IA aplica a arte na pele"
        className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-lift)]"
      >
        {/* PELE — gradiente quente com sombreado */}
        <div className="absolute inset-0 skin" />
        <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-multiply [background:radial-gradient(120%_80%_at_80%_-10%,transparent,rgba(20,15,10,0.28))]" />

        {/* GRID técnico discreto */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:28px_28px]"
        />

        {/* A TATUAGEM — desenhada traço a traço (fine line botânico) */}
        <svg
          viewBox="0 0 200 260"
          className="absolute left-1/2 top-1/2 h-[74%] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply dark:mix-blend-screen"
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* haste principal */}
          <m.path d="M100 244 C100 200 100 150 100 96 C100 70 100 44 100 20" initial={false} animate={drawn} />
          {/* folhas / ramos simétricos */}
          <m.path
            d="M100 200 C74 190 58 168 54 140 M100 200 C126 190 142 168 146 140"
            initial={false}
            animate={drawn}
          />
          <m.path
            d="M100 160 C80 152 68 134 66 112 M100 160 C120 152 132 134 134 112"
            initial={false}
            animate={drawn}
          />
          <m.path
            d="M100 120 C86 114 78 100 77 84 M100 120 C114 114 122 100 123 84"
            initial={false}
            animate={drawn}
          />
          {/* flor no topo — pétalas */}
          <m.path
            d="M100 20 C88 26 82 40 92 50 C98 56 102 56 108 50 C118 40 112 26 100 20 Z M100 20 C100 8 100 4 100 4 M84 34 C74 30 66 32 66 32 M116 34 C126 30 134 32 134 32"
            initial={false}
            animate={drawn}
          />
          {/* pontilhado (dotwork) */}
          {[
            [100, 232],
            [100, 216],
            [78, 128],
            [122, 128],
            [70, 100],
            [130, 100],
          ].map(([cx, cy], i) => (
            <m.circle
              key={i}
              cx={cx}
              cy={cy}
              r="2"
              fill="var(--foreground)"
              stroke="none"
              initial={false}
              animate={reduce ? { opacity: 1 } : { opacity: [0, 0, 1, 1, 0], transition: { duration: LOOP, times: [0, 0.5, 0.66, 0.86, 1], repeat: Infinity } }}
            />
          ))}
        </svg>

        {/* CAMADA DE DETECÇÃO — linha de varredura */}
        {!reduce && (
          <m.div
            aria-hidden
            className="absolute inset-x-0 h-px bg-primary shadow-[0_0_24px_6px_var(--primary)]"
            initial={{ top: "-10%", opacity: 0 }}
            animate={{ top: ["-10%", "100%", "100%", "100%", "-10%"], opacity: [0, 0.85, 0, 0, 0] }}
            transition={{ duration: LOOP, times: [0.06, 0.26, 0.3, 0.98, 1], repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* Cantos / brackets de detecção */}
        <div aria-hidden className="pointer-events-none absolute inset-5">
          {["left-0 top-0 border-l-2 border-t-2", "right-0 top-0 border-r-2 border-t-2", "left-0 bottom-0 border-l-2 border-b-2", "right-0 bottom-0 border-r-2 border-b-2"].map(
            (c) => (
              <m.span
                key={c}
                className={`absolute size-5 border-primary ${c}`}
                initial={false}
                {...(fade([0, 1, 1, 0.4, 0], [0.04, 0.14, 0.6, 0.9, 1]) ?? { animate: { opacity: 0.5 } as const })}
                style={reduce ? { opacity: 0.4 } : undefined}
              />
            ),
          )}
        </div>

        {/* Rótulo status (topo) */}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-primary/30 bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            IA · Simulação
          </span>
          <m.span
            className="rounded-[4px] border border-border bg-background/70 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur"
            initial={false}
            {...(fade([1, 1, 1, 1, 1], [0, 0.25, 0.5, 0.75, 1]) ?? {})}
          >
            <m.span initial={false} {...(fade([0, 0, 1, 1, 1], [0, 0.28, 0.32, 0.9, 1]) ?? {})}>
              pele detectada · 98%
            </m.span>
          </m.span>
        </div>

        {/* Passos (base) — ENVIA → APLICA → RESULTADO */}
        <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-1.5">
          {["Envia foto", "IA aplica", "Na pele"].map((label, i) => {
            const start = [0.06, 0.3, 0.62][i]!;
            return (
              <m.div
                key={label}
                className="rounded-[4px] border border-border bg-background/70 px-2 py-1.5 backdrop-blur"
                initial={false}
                {...(reduce
                  ? { animate: i === 2 ? { borderColor: "var(--primary)" } : {} }
                  : {
                      animate: { borderColor: ["var(--border)", "var(--border)", "var(--primary)", "var(--border)"] },
                      transition: { duration: LOOP, times: [0, start, Math.min(start + 0.08, 1), 1], repeat: Infinity },
                    })}
              >
                <span className="font-mono text-[9px] text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-[11px] font-medium leading-tight">{label}</p>
              </m.div>
            );
          })}
        </div>
      </figure>

      <style>{`
        .skin {
          background:
            radial-gradient(120% 90% at 30% 15%, #f0d9bd, transparent 60%),
            radial-gradient(120% 90% at 75% 85%, #d8b48c, transparent 55%),
            linear-gradient(150deg, #e9cdaa 0%, #dcbb95 55%, #cda581 100%);
          background-color: #e3c4a1;
        }
        .dark .skin {
          background:
            radial-gradient(120% 90% at 30% 15%, #4a3728, transparent 60%),
            radial-gradient(120% 90% at 75% 85%, #2a1e15, transparent 55%),
            linear-gradient(150deg, #3a2b20 0%, #2b2017 55%, #211812 100%);
          background-color: #2e2318;
        }
      `}</style>
    </LazyMotion>
  );
}
