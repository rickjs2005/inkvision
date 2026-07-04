import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { HeroSimulation } from "@/components/marketing/hero-simulation";

/**
 * Moldura split-screen do grupo (auth). Esquerda (40%): a MESMA demonstração de
 * IA do hero — produto vivo, não card estático. Direita (60%): o formulário, que
 * ganha protagonismo (quem chegou aqui já decidiu se cadastrar).
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[40%_60%]">
      <BrandPanel />

      <main className="flex min-h-dvh flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mb-10 lg:hidden">
          <Link href="/" aria-label="InkVision — página inicial">
            <Wordmark />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[#14110e] px-10 py-12 text-[#f2eee6] lg:flex lg:flex-col lg:justify-between xl:px-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[460px] w-[460px] rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
      />

      <Link href="/" aria-label="InkVision — página inicial" className="relative z-10 w-fit">
        <Wordmark />
      </Link>

      <div className="relative z-10 my-8">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-primary" />
          <span className="eyebrow text-[#a79e8e]">Veja acontecendo</span>
        </div>
        <h2 className="mt-6 max-w-md font-display text-[2.4rem] font-light leading-[1.02] tracking-[-0.025em]">
          A tatuagem na sua pele, <span className="italic text-primary">antes</span> da agulha.
        </h2>

        {/* A demonstração de IA — mesma do hero */}
        <div className="mt-8 max-w-[320px]">
          <HeroSimulation />
        </div>
      </div>

      <div className="relative z-10 flex items-end justify-between border-t border-[#f2eee6]/12 pt-5">
        <div>
          <div className="font-display text-3xl leading-none">12.000+</div>
          <div className="eyebrow mt-1.5 text-[#a79e8e]">Simulações geradas</div>
        </div>
        <div className="font-mono text-[11px] leading-relaxed text-[#a79e8e]">
          <div>120 estúdios · 4.9 ★</div>
          <div>REALISMO · FINE LINE · BLACKWORK</div>
        </div>
      </div>
    </aside>
  );
}
