import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/brand/wordmark";

/**
 * Moldura editorial split-screen do grupo (auth).
 * Esquerda: painel de tinta impactante (escondido no mobile).
 * Direita: o formulário da página (login / cadastro).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <BrandPanel />

      {/* Lado do formulário */}
      <main className="flex min-h-dvh flex-col justify-center px-6 py-12 sm:px-10">
        {/* Wordmark compacto só no mobile (o painel some) */}
        <div className="mb-10 lg:hidden">
          <Link href="/" aria-label="InkVision — página inicial">
            <Wordmark />
          </Link>
        </div>

        <div className="mx-auto w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#14110e] px-12 py-14 text-[#f2eee6] lg:flex lg:flex-col lg:justify-between">
      {/* halo de tinta discreto */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[460px] w-[460px] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
      />

      {/* Topo — marca */}
      <Link
        href="/"
        aria-label="InkVision — página inicial"
        className="relative z-10 w-fit"
      >
        <Wordmark />
      </Link>

      {/* Meio — frase display + espécime */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          <span className="eyebrow text-[#a79e8e]">Ateliê digital de tatuagem</span>
        </div>

        <h2 className="mt-7 max-w-md font-display text-[2.75rem] font-light leading-[1.02] tracking-[-0.025em]">
          Sua próxima tatuagem,
          <br />
          <span className="italic text-primary">visualizada</span> antes da agulha.
        </h2>

        <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-[#a79e8e]">
          Aprove o desenho no chat e veja a simulação na sua própria foto — com IA.
        </p>
      </div>

      {/* Base — espécime tipográfico + rodapé */}
      <div className="relative z-10">
        <InkSpecimen />

        <div className="mt-10 flex items-end justify-between border-t border-[#f2eee6]/12 pt-5">
          <div>
            <div className="font-display text-3xl leading-none">+2.4 mil</div>
            <div className="eyebrow mt-1.5 text-[#a79e8e]">Simulações geradas</div>
          </div>
          <div className="font-mono text-[11px] leading-relaxed text-[#a79e8e]">
            <div>REALISMO · FINE LINE</div>
            <div>BLACKWORK · OLD SCHOOL</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* Espécime de tinta simplificado — eco do hero, sem animação. */
function InkSpecimen() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#f2eee6]/10 bg-[#1b1712] p-7 shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between">
        <span className="eyebrow text-[#a79e8e]">Espécime · 01</span>
        <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          <span className="size-1.5 animate-pulse rounded-full bg-primary" />
          Simulação IA
        </span>
      </div>

      <div className="relative mt-8">
        <span className="pointer-events-none absolute -left-2 -top-12 select-none font-display text-[9rem] leading-none text-[#f2eee6]/[0.04]">
          &amp;
        </span>
        <p className="font-display text-5xl italic leading-none">Tinta</p>
        <p className="mt-2 font-display text-5xl leading-none tracking-[-0.02em]">na pele</p>
        <span className="mt-5 block h-14 w-px bg-gradient-to-b from-primary to-transparent" />
      </div>

      <div className="mt-6 flex items-center justify-end">
        <ArrowUpRight className="size-5 text-primary" />
      </div>
    </div>
  );
}
