import Link from "next/link";
import { notFound } from "next/navigation";
import { studioRoleAtLeast } from "@inkvision/shared";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { prisma } from "@inkvision/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddArtistForm } from "./add-artist-form";

export default async function StudioArtistsPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const actor = await requireActor();

  const membership = actor.memberships.find((m) => m.studioId === studioId);
  const canManage =
    actor.platformRole === "ADMIN" || (membership && studioRoleAtLeast(membership.role, "MANAGER"));
  if (!canManage) notFound();

  const studio = await prisma.studio.findUnique({ where: { id: studioId }, select: { name: true } });
  if (!studio) notFound();

  const artists = await useCases.listStudioArtists.execute(actor, studioId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">{studio.name}</p>
        <h1 className="text-2xl font-bold">Tatuadores</h1>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Adicionar tatuador</CardTitle>
        </CardHeader>
        <CardContent>
          <AddArtistForm studioId={studioId} />
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {artists.length === 0 && (
          <p className="text-muted-foreground">Nenhum tatuador ainda.</p>
        )}
        {artists.map((a) => (
          <Card key={a.id}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.name}</span>
                  {!a.isActive && <Badge variant="neutral">Inativo</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {a.styles.map((s) => s.name).join(" · ") || "Sem estilos definidos"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/artista/${a.id}`}>Editar</Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/t/${a.id}`}>Ver público</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
