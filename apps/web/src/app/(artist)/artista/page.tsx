import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requireActor } from "@/server/auth-context";
import { prisma } from "@inkvision/db";
import { Button } from "@/components/ui/button";

export default async function ArtistHomePage() {
  const actor = await requireActor();

  const profiles = await prisma.artistProfile.findMany({
    where: { userId: actor.userId },
    select: { id: true, studio: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Seu espaço · Ateliês</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          Seus perfis
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {String(profiles.length).padStart(2, "0")}{" "}
          {profiles.length === 1 ? "ateliê" : "ateliês"}
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="mt-14 border-t border-border pt-10">
          <p className="font-display text-2xl text-muted-foreground">
            Você ainda não é tatuador em nenhum estúdio.
          </p>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Peça ao dono do estúdio para adicionar o seu e-mail — assim que ele fizer isso,
            o seu perfil aparecerá aqui.
          </p>
        </div>
      ) : (
        <ul className="mt-10 border-t border-border">
          {profiles.map((p, i) => (
            <li
              key={p.id}
              className="group grid grid-cols-[2rem_1fr] items-center gap-x-4 gap-y-4 border-b border-border py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:gap-6"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <Link
                  href={`/artista/${p.id}`}
                  className="font-display text-2xl leading-tight transition-colors hover:text-primary sm:text-3xl"
                >
                  {p.studio.name}
                </Link>
                <span className="mt-1 block eyebrow">Perfil de tatuador</span>
              </div>
              <div className="col-span-2 flex items-center gap-2 sm:col-span-1 sm:justify-self-end">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/t/${p.id}`}>Ver página</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/artista/${p.id}`}>
                    Gerenciar
                    <ArrowUpRight />
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
