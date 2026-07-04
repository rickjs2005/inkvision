import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/order/status-badge";

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
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm text-muted-foreground">{artist.name}</p>
      <h1 className="text-2xl font-bold">Pedidos recebidos</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-muted-foreground">Nenhum pedido ainda.</p>
      ) : (
        <div className="mt-6 grid gap-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/artista/${artistId}/pedidos/${o.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{o.clientName}</p>
                    <p className="text-sm text-muted-foreground">{o.bodyPart}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
