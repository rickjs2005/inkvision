import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-8 py-16 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl"
            style={{ background: "radial-gradient(600px 200px at 50% 0%, var(--primary), transparent)" }}
          />
          <h2 className="text-balance text-4xl font-bold tracking-tight">
            Comece seu projeto agora
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Crie sua conta gratuita, escolha um artista e veja a arte na sua pele antes de decidir.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/cadastro">Criar conta grátis</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/tatuadores">Explorar tatuadores</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
