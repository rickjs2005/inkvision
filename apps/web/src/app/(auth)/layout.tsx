import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { HeroSimulation } from "@/components/marketing/hero-simulation";
import { AuthStatsProvider } from "@/components/auth/auth-stats";
import { getPublicStats } from "@/server/queries/home";
import { formatRating, formatStatCount, type PublicStats } from "@/lib/public-stats";

/**
 * Moldura split-screen do grupo (auth). Esquerda (40%): a MESMA demonstração de
 * IA do hero — produto vivo, não card estático. Direita (60%): o formulário, que
 * ganha protagonismo (quem chegou aqui já decidiu se cadastrar).
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const stats = await getPublicStats();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[40%_60%]">
      <BrandPanel stats={stats} />

      <main className="flex min-h-dvh flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mb-10 lg:hidden">
          <Link href="/" aria-label="InkVision — página inicial">
            <Wordmark />
          </Link>
        </div>
        <div className="mx-auto w-full max-w-md">
          <AuthStatsProvider stats={stats}>{children}</AuthStatsProvider>
        </div>
      </main>
    </div>
  );
}

function BrandPanel({ stats }: { stats: PublicStats | null }) {
  // Métrica principal do rodapé: simulações; sem elas, estúdios ativos.
  const big =
    stats && stats.simulations > 0
      ? {
          value: formatStatCount(stats.simulations),
          label: stats.simulations === 1 ? "Simulação gerada" : "Simulações geradas",
        }
      : stats && stats.activeStudios > 0
        ? {
            value: formatStatCount(stats.activeStudios),
            label: stats.activeStudios === 1 ? "Estúdio na rede" : "Estúdios na rede",
          }
        : null;
  const side = [
    stats && stats.simulations > 0 && stats.activeStudios > 0
      ? `${stats.activeStudios} ${stats.activeStudios === 1 ? "estúdio" : "estúdios"}`
      : null,
    stats?.ratingAvg && stats.ratingCount > 0 ? `${formatRating(stats.ratingAvg)} ★` : null,
  ]
    .filter(Boolean)
    .join(" · ");
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
        {big && (
          <div>
            <div className="font-display text-3xl leading-none">{big.value}</div>
            <div className="eyebrow mt-1.5 text-[#a79e8e]">{big.label}</div>
          </div>
        )}
        <div className="font-mono text-[11px] leading-relaxed text-[#a79e8e]">
          {side && <div>{side}</div>}
          <div>REALISMO · FINE LINE · BLACKWORK</div>
        </div>
      </div>
    </aside>
  );
}
