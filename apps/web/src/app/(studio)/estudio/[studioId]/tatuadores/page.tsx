import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { studioRoleAtLeast } from "@inkvision/shared";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { prisma } from "@inkvision/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StudioNav } from "@/components/layout/studio-nav";
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
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Equipe · {studio.name}</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          Tatuadores
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {String(artists.length).padStart(2, "0")}{" "}
          {artists.length === 1 ? "membro" : "membros"}
        </p>
      </div>
      <StudioNav studioId={studioId} current="tatuadores" />

      {/* Adicionar tatuador */}
      <section className="mt-10 rounded-lg border border-border bg-muted/40 p-6">
        <p className="eyebrow text-muted-foreground">Adicionar tatuador</p>
        <div className="mt-4">
          <AddArtistForm studioId={studioId} />
        </div>
      </section>

      {/* Lista de membros — linhas com hairline */}
      <div className="mt-12 flex items-center gap-3">
        <span className="h-px w-8 bg-border" />
        <span className="eyebrow text-muted-foreground">No estúdio</span>
      </div>

      {artists.length === 0 ? (
        <p className="mt-8 font-display text-2xl text-muted-foreground">
          Nenhum tatuador ainda.
        </p>
      ) : (
        <ul className="mt-2">
          {artists.map((a, i) => (
            <li
              key={a.id}
              className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-border py-6 sm:gap-6"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-2xl leading-tight sm:text-3xl">
                    {a.name}
                  </span>
                  {!a.isActive && <Badge variant="neutral">Inativo</Badge>}
                </div>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {a.styles.map((s) => s.name).join(" · ") || "Sem estilos definidos"}
                </p>
              </div>
              <div className="flex items-center gap-2 justify-self-end">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/artista/${a.id}`}>Editar</Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/t/${a.id}`} className="gap-1">
                    Ver público
                    <ArrowUpRight className="size-4" />
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
