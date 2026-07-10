import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24 lg:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-foreground px-8 py-16 text-background shadow-[var(--shadow-lift)] sm:px-14 lg:px-16 lg:py-20">
          {/* halo de tinta discreto, canto superior */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-[0.18] blur-3xl"
            style={{ background: "radial-gradient(closest-side, var(--primary), transparent)" }}
          />
          {/* numeral decorativo, marca d'água tipográfica */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-10 right-4 select-none font-display text-[12rem] italic leading-none text-background/[0.05]"
          >
            &amp;
          </span>

          <div className="relative flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
            {/* Bloco editorial — título à esquerda */}
            <div className="max-w-xl">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow text-background/70">Comece agora</span>
              </div>
              <h2 className="mt-6 text-balance font-display text-4xl font-light leading-[1.02] tracking-[-0.02em] sm:text-5xl lg:text-6xl">
                Veja a arte na sua
                <br />
                pele <span className="italic text-primary">antes da agulha.</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-background/70">
                Crie sua conta gratuita, escolha um artista e aprove o desenho com simulação por IA —
                tudo antes de decidir.
              </p>
            </div>

            {/* Ações à direita */}
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Button size="lg" asChild>
                <Link href="/cadastro">Criar conta</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-background/25 text-background hover:border-background/50 hover:bg-background/[0.06]"
              >
                <Link href="/tatuadores">Explorar tatuadores</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
