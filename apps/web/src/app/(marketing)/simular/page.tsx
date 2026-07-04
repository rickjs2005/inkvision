import type { Metadata } from "next";
import { SimulatorStudio } from "@/components/simulator/simulator-studio";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Simular tatuagem",
  description:
    "Experimente sem cadastro: escolha um desenho, posicione na sua pele e veja a prévia da tatuagem. Depois, faça de verdade com um artista da InkVision.",
  alternates: { canonical: `${APP_URL}/simular` },
  openGraph: { title: "Simule sua tatuagem — InkVision", type: "website" },
};

const STEPS = [
  { n: "01", t: "Escolha a pele", d: "Envie sua foto ou use uma pele de exemplo." },
  { n: "02", t: "Escolha a arte", d: "Selecione um desenho da galeria." },
  { n: "03", t: "Posicione", d: "Arraste, ajuste tamanho e rotação." },
];

export default function SimularPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Experimente · sem cadastro</span>
      </div>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.03em] sm:text-6xl">
          Simule sua tatuagem <span className="italic text-primary">agora</span>.
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">
          Uma prévia interativa da ideia na sua pele. É só brincar — nada é enviado a lugar nenhum.
          Quando gostar, faça de verdade com um artista, com a IA aplicando perspectiva e luz.
        </p>
      </div>

      {/* Como funciona */}
      <ol className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="bg-background p-5">
            <span className="font-mono text-xs text-primary">{s.n}</span>
            <p className="mt-1 font-display text-lg leading-tight">{s.t}</p>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </li>
        ))}
      </ol>

      {/* Estúdio */}
      <div className="mt-12">
        <SimulatorStudio />
      </div>
    </div>
  );
}
