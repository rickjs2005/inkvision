import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold">Agenda</h1>
      <Card>
        <CardHeader>
          <CardTitle>Disponibilidade semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityEditor artistId={artistId} initial={rules} />
        </CardContent>
      </Card>
    </div>
  );
}
