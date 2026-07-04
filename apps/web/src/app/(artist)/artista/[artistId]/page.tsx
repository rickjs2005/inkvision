import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { StylesSelector } from "./styles-selector";
import { PortfolioManager } from "./portfolio-manager";

export default async function ArtistEditPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const actor = await requireActor();

  // getArtist permite ver inativo para membros/admin; a autorização de edição
  // é reforçada em cada action (assertCanManageArtist).
  let artist;
  try {
    artist = await useCases.getArtist.execute(artistId, actor);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  const canManage =
    actor.platformRole === "ADMIN" ||
    artist.userId === actor.userId ||
    actor.memberships.some((m) => m.studioId === artist.studioId && m.role !== "ARTIST");
  if (!canManage) notFound();

  const [styles, items] = await Promise.all([
    repositories.styles.listAll(),
    useCases.listPortfolio.execute(artistId, actor.userId),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{artist.name}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/artista/${artistId}/agenda`}>Agenda</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/artista/${artistId}/pedidos`}>Pedidos recebidos</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm artist={artist} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Especialidades</CardTitle>
          </CardHeader>
          <CardContent>
            <StylesSelector
              artistId={artistId}
              allStyles={styles}
              selectedIds={artist.styles.map((s) => s.id)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfólio</CardTitle>
          </CardHeader>
          <CardContent>
            <PortfolioManager
              artistId={artistId}
              studioId={artist.studioId}
              items={items}
              styles={styles}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
