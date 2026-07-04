import Link from "next/link";
import { requireActor } from "@/server/auth-context";
import { prisma } from "@inkvision/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ArtistHomePage() {
  const actor = await requireActor();

  const profiles = await prisma.artistProfile.findMany({
    where: { userId: actor.userId },
    select: { id: true, studio: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Seus perfis de tatuador</h1>
      {profiles.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          Você ainda não é tatuador em nenhum estúdio. Peça ao dono do estúdio para adicionar seu
          e-mail.
        </p>
      ) : (
        <div className="mt-6 grid gap-3">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between p-5">
                <span className="font-medium">{p.studio.name}</span>
                <div className="flex gap-2">
                  <Button size="sm" asChild>
                    <Link href={`/artista/${p.id}`}>Gerenciar perfil</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/t/${p.id}`}>Ver página</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
