"use client";

import Image from "next/image";
import { LazyMotion, domAnimation, m, useReducedMotion } from "framer-motion";

/**
 * Demonstração cinematográfica do produto: uma FOTO real de pele/braço recebe a
 * arte. A IA "escaneia a pele" e revela a tatuagem (cinza → cor) numa passagem de
 * scanner, em loop de ~7s (antes → depois). Humaniza o hero — vende o resultado,
 * não a interface. Respeita prefers-reduced-motion.
 *
 * A imagem é decorativa; trocar a URL (Unsplash whitelisted) muda o "modelo".
 */
const PHOTO =
  "https://images.unsplash.com/photo-1565058379802-bbe93b2f703a?auto=format&fit=crop&w=900&q=80";
const LOOP = 7;

export function HeroSimulation() {
  const reduce = useReducedMotion();
  const t = { duration: LOOP, times: [0, 0.14, 0.34, 0.72, 0.9, 1], repeat: Infinity, ease: "easeInOut" as const };

  return (
    <LazyMotion features={domAnimation}>
      <figure
        aria-label="Simulação: a IA aplica a tatuagem na pele (antes e depois)"
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)]"
      >
        {/* DEPOIS — foto em cor (resultado) */}
        <Image
          src={PHOTO}
          alt="Tatuagem aplicada na pele — resultado"
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 460px"
          className="object-cover"
        />

        {/* ANTES — mesma foto dessaturada, revelada da esquerda p/ direita */}
        <m.div
          className="absolute inset-0"
          initial={false}
          animate={
            reduce
              ? { clipPath: "inset(0 0 0 100%)" }
              : { clipPath: ["inset(0 0 0 0%)", "inset(0 0 0 0%)", "inset(0 0 0 100%)", "inset(0 0 0 100%)", "inset(0 0 0 0%)", "inset(0 0 0 0%)"] }
          }
          transition={reduce ? undefined : t}
        >
          <Image
            src={PHOTO}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1024px) 90vw, 460px"
            className="object-cover grayscale brightness-[0.82] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-foreground/10" />
        </m.div>

        {/* Iluminação cinematográfica + vinheta */}
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(120%_90%_at_25%_0%,rgba(255,240,220,0.18),transparent_45%)]" />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_30px_rgba(20,15,10,0.55)]" />

        {/* Linha de scanner (acompanha a revelação) */}
        {!reduce && (
          <m.div
            aria-hidden
            className="absolute inset-y-0 w-px bg-primary shadow-[0_0_24px_5px_var(--primary)]"
            initial={false}
            animate={{ left: ["0%", "0%", "100%", "100%", "0%", "0%"] }}
            transition={t}
          >
            <span className="absolute -left-1 top-4 size-2.5 rounded-full bg-primary shadow-[0_0_12px_3px_var(--primary)]" />
          </m.div>
        )}

        {/* Crosshair de detecção */}
        <div aria-hidden className="pointer-events-none absolute left-[38%] top-[42%] size-16 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-primary/50" />
          <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-primary/50" />
          <span className="absolute inset-0 rounded-full border border-primary/60" />
        </div>

        {/* Chip status (topo) */}
        <div className="absolute inset-x-4 top-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-primary/40 bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-primary backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            IA · Simulação
          </span>
          <span className="rounded-[4px] border border-white/20 bg-black/45 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white/85 backdrop-blur">
            pele detectada · 98%
          </span>
        </div>

        {/* Rótulos Antes / Depois */}
        <m.span
          className="absolute bottom-4 left-4 rounded-[4px] border border-white/20 bg-black/50 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-white/90 backdrop-blur"
          initial={false}
          animate={reduce ? { opacity: 0 } : { opacity: [1, 1, 0.15, 0.15, 1, 1] }}
          transition={reduce ? undefined : t}
        >
          Antes
        </m.span>
        <span className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 rounded-[4px] border border-primary/40 bg-primary/90 px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest text-primary-foreground">
          Depois
        </span>
      </figure>

      {/* coordenada técnica discreta, "saindo" da moldura */}
      <div aria-hidden className="absolute -right-3 top-1/3 hidden rotate-90 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground xl:block">
        x 0.62 · y 0.41 · scale 1.0
      </div>
    </LazyMotion>
  );
}
