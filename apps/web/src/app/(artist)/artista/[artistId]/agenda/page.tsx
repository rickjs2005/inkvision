import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { AvailabilityEditor } from "./availability-editor";

export default async function ArtistAgendaPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const actor = await requireActor();

  let rules;
  try {
    rules = await useCases.getAvailability.execute(actor, artistId);
  } catch (e) {
    if (e instanceof DomainError) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Configurações · Agenda</span>
      </div>
      <div className="mt-5">
        <h1 className="font-display text-4xl font-light leading-[0.95] tracking-[-0.025em] sm:text-5xl">
          Disponibilidade
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          Defina as janelas de cada dia da semana — é nelas que os clientes poderão
          reservar as suas sessões.
        </p>
      </div>

      <section className="mt-14">
        <header className="flex items-baseline gap-3 border-t border-border pt-5">
          <span className="font-mono text-xs text-muted-foreground">01</span>
          <h2 className="font-display text-xl">Disponibilidade semanal</h2>
        </header>
        <div className="mt-6">
          <AvailabilityEditor artistId={artistId} initial={rules} />
        </div>
      </section>
    </div>
  );
}
