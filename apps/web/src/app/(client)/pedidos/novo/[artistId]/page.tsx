import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { OrderForm } from "./order-form";

export default async function NewOrderPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  await requireActor(); // precisa estar logado para pedir

  let artist;
  try {
    artist = await useCases.getArtist.execute(artistId, null);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  const styles = await repositories.styles.listAll();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">O briefing · Novo projeto</span>
      </div>

      <h1 className="mt-5 font-display text-4xl font-light leading-[0.98] tracking-[-0.025em] sm:text-5xl">
        Novo projeto com{" "}
        <span className="italic text-primary">{artist.name}</span>
      </h1>

      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted-foreground">
        Descreva sua ideia e envie referências — o tatuador responde com um
        orçamento sob medida.
      </p>

      {/* Régua de ateliê */}
      <div className="mt-8 border-t border-border pt-10">
        <OrderForm artistId={artist.id} studioId={artist.studioId} styles={styles} />
      </div>
    </div>
  );
}
