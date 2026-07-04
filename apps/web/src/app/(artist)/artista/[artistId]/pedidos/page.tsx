import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { StatusBadge } from "@/components/order/status-badge";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function ArtistOrdersPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const actor = await requireActor();

  let artist;
  try {
    artist = await useCases.getArtist.execute(artistId, actor);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  let orders;
  try {
    orders = await useCases.listArtistOrders.execute(actor, artist.studioId, artistId);
  } catch (e) {
    if (e instanceof DomainError && e.code === "FORBIDDEN") notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">{artist.name} · Fila</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          Pedidos recebidos
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {String(orders.length).padStart(2, "0")}{" "}
          {orders.length === 1 ? "pedido" : "pedidos"}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-14 border-t border-border pt-10">
          <p className="font-display text-2xl text-muted-foreground">Nenhum pedido ainda.</p>
        </div>
      ) : (
        <ul className="mt-10 border-t border-border">
          {orders.map((o, i) => (
            <li key={o.id}>
              <Link
                href={`/artista/${artistId}/pedidos/${o.id}`}
                className="group grid grid-cols-[2rem_1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border py-6 transition-colors hover:bg-muted/40 sm:grid-cols-[2.5rem_1.5fr_auto_auto] sm:gap-6 sm:px-2"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <span className="font-display text-2xl leading-tight transition-colors group-hover:text-primary sm:text-3xl">
                    {o.clientName}
                  </span>
                  <span className="mt-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {o.bodyPart}
                  </span>
                </div>
                <time className="col-start-2 row-start-2 font-mono text-xs text-muted-foreground sm:col-start-auto sm:row-start-auto sm:justify-self-end">
                  {dateFmt.format(o.createdAt)}
                </time>
                <div className="flex items-center gap-4 justify-self-end">
                  <StatusBadge status={o.status} />
                  <ArrowUpRight className="hidden size-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
