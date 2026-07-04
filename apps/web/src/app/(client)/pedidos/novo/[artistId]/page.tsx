import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Solicitar orçamento</CardTitle>
          <CardDescription>
            Para <span className="font-medium text-foreground">{artist.name}</span>. Descreva sua
            ideia e envie referências — o tatuador responde com um orçamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderForm artistId={artist.id} studioId={artist.studioId} styles={styles} />
        </CardContent>
      </Card>
    </div>
  );
}
