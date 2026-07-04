"use client";

import Image from "next/image";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

/**
 * Demonstração cinematográfica: FOTO real de pele recebe a arte. A IA "escaneia"
 * (HUD com pontos de rastreamento + malha vetorial + sequência de status) e revela
 * a tatuagem cinza → cor, antes → depois, em loop de ~8s. Comunica pele E IA.
 * Self-contained (só a foto é remota) e respeita prefers-reduced-motion.
 */
const PHOTO =
  "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?auto=format&fit=crop&w=900&q=80";
const LOOP = 8;

// Pontos de rastreamento sobre a pele (coordenadas no viewBox 100x125).
const TRACK = [
  { x: 34, y: 40 },
  { x: 60, y: 34 },
  { x: 67, y: 58 },
  { x: 45, y: 72 },
  { x: 31, y: 88 },
];

// Sequência de status (janelas de opacidade dentro do loop).
const STEPS: [string, number, number][] = [
  ["inicializando", 0.02, 0.12],
  ["escaneando pele", 0.12, 0.3],
  ["pele detectada · 98%", 0.3, 0.42],
  ["aplicando arte", 0.42, 0.6],
  ["perspectiva · luz · sombra", 0.6, 0.74],
  ["pronto", 0.74, 0.98],
];

export function HeroSimulation() {
  const reduce = useReducedMotion();
  const t = { duration: LOOP, times: [0, 0.16, 0.36, 0.72, 0.9, 1], repeat: Infinity, ease: "easeInOut" as const };

  // opacidade em janela [a,b] com fade nas bordas
  const win = (a: number, b: number) =>
    reduce
      ? undefined
      : {
          animate: { opacity: [0, 0, 1, 1, 0, 0] },
          transition: {
            duration: LOOP,
            times: [0, a, Math.min(a + 0.03, 1), Math.max(b - 0.03, a + 0.031), b, 1],
            repeat: Infinity,
            ease: "linear" as const,
          },
        };

  return (
    <LazyMotion features={domAnimation}>
      <figure
        aria-label="Simulação: a IA aplica a tatuagem na pele (antes e depois)"
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)]"
      >
        {/* DEPOIS — foto em cor */}
        <Image src={PHOTO} alt="Tatuagem aplicada na pele — resultado" fill priority sizes="(max-width: 1024px) 90vw, 480px" className="object-cover" />

        {/* ANTES — dessaturada, revelada esquerda→direita */}
        <m.div
          className="absolute inset-0"
          initial={false}
          animate={reduce ? { clipPath: "inset(0 0 0 100%)" } : { clipPath: ["inset(0 0 0 0%)", "inset(0 0 0 0%)", "inset(0 0 0 100%)", "inset(0 0 0 100%)", "inset(0 0 0 0%)", "inset(0 0 0 0%)"] }}
          transition={reduce ? undefined : t}
        >
          <Image src={PHOTO} alt="" aria-hidden fill sizes="(max-width: 1024px) 90vw, 480px" className="object-cover grayscale brightness-[0.82] contrast-[1.05]" />
          <div className="absolute inset-0 bg-foreground/10" />
        </m.div>

        {/* Luz + vinheta cinematográfica */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_25%_0%,rgba(255,240,220,0.18),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_30px_rgba(20,15,10,0.55)]" />

        {/* HUD — malha vetorial + pontos de rastreamento */}
        <svg viewBox="0 0 100 125" className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
          <m.polyline
            points={TRACK.map((p) => `${p.x},${p.y}`).join(" ")}
            stroke="var(--primary)"
            strokeWidth="0.4"
            strokeDasharray="1.5 1.5"
            initial={false}
            animate={reduce ? { pathLength: 1, opacity: 0.5 } : { pathLength: [0, 0, 1, 1, 0], opacity: [0, 0, 0.6, 0.6, 0], transition: { duration: LOOP, times: [0, 0.16, 0.42, 0.86, 1], repeat: Infinity } }}
          />
          {TRACK.map((p, i) => (
            <m.g key={i} initial={false} {...(win(0.16 + i * 0.03, 0.9) ?? { animate: { opacity: 0.6 } })}>
              <circle cx={p.x} cy={p.y} r="2.4" stroke="var(--primary)" strokeWidth="0.4" />
              <circle cx={p.x} cy={p.y} r="0.7" fill="var(--primary)" />
              <line x1={p.x - 4} y1={p.y} x2={p.x - 2.8} y2={p.y} stroke="var(--primary)" strokeWidth="0.4" />
              <line x1={p.x + 2.8} y1={p.y} x2={p.x + 4} y2={p.y} stroke="var(--primary)" strokeWidth="0.4" />
            </m.g>
          ))}
        </svg>

        {/* Scanner vertical */}
        {!reduce && (
          <m.div aria-hidden className="absolute inset-y-0 w-px bg-primary shadow-[0_0_24px_5px_var(--primary)]" initial={false} animate={{ left: ["0%", "0%", "100%", "100%", "0%", "0%"] }} transition={t}>
            <span className="absolute -left-1 top-4 size-2.5 rounded-full bg-primary shadow-[0_0_12px_3px_var(--primary)]" />
          </m.div>
        )}

        {/* Chip IA (topo) */}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-primary/40 bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            InkVision · IA
          </span>
          {/* Sequência de status */}
          <span className="relative h-6 min-w-[9.5rem] rounded-[4px] border border-white/20 bg-black/50 px-2 backdrop-blur">
            {STEPS.map(([label, a, b], i) => (
              <m.span
                key={i}
                className="absolute inset-0 flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-white/90"
                initial={false}
                animate={reduce ? { opacity: i === STEPS.length - 1 ? 1 : 0 } : { opacity: [0, 0, 1, 1, 0, 0] }}
                transition={reduce ? undefined : { duration: LOOP, times: [0, a, Math.min(a + 0.02, 1), Math.max(b - 0.02, a + 0.021), b, 1], repeat: Infinity, ease: "linear" }}
              >
                {i === STEPS.length - 1 && <span className="text-primary">✓</span>}
                {label}
              </m.span>
            ))}
          </span>
        </div>

        {/* Rótulos Antes / Depois */}
        <m.span className="absolute bottom-4 left-4 rounded-[4px] border border-white/20 bg-black/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/90 backdrop-blur" initial={false} animate={reduce ? { opacity: 0 } : { opacity: [1, 1, 0.15, 0.15, 1, 1] }} transition={reduce ? undefined : t}>
          Antes
        </m.span>
        <span className="absolute bottom-4 right-4 rounded-[4px] border border-primary/40 bg-primary/90 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-primary-foreground">
          Depois
        </span>
      </figure>
    </LazyMotion>
  );
}
