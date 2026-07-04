import Link from "next/link";
import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Perfil do artista</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-light leading-[0.95] tracking-[-0.025em] sm:text-5xl">
          {artist.name}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/artista/${artistId}/agenda`}>Agenda</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/artista/${artistId}/pedidos`}>Pedidos recebidos</Link>
          </Button>
        </div>
      </div>

      <div className="mt-14 space-y-16">
        {/* 01 — Perfil */}
        <section>
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-border pt-5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground">01</span>
              <h2 className="font-display text-xl">Perfil</h2>
            </div>
            <p className="text-sm text-muted-foreground">Nome, bio e apresentação públicos.</p>
          </header>
          <div className="mt-6">
            <ProfileForm artist={artist} />
          </div>
        </section>

        {/* 02 — Especialidades */}
        <section>
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-border pt-5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground">02</span>
              <h2 className="font-display text-xl">Especialidades</h2>
            </div>
            <p className="text-sm text-muted-foreground">Os estilos que definem o seu traço.</p>
          </header>
          <div className="mt-6">
            <StylesSelector
              artistId={artistId}
              allStyles={styles}
              selectedIds={artist.styles.map((s) => s.id)}
            />
          </div>
        </section>

        {/* 03 — Portfólio */}
        <section>
          <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-border pt-5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-xs text-muted-foreground">03</span>
              <h2 className="font-display text-xl">Portfólio</h2>
            </div>
            <p className="text-sm text-muted-foreground">Os trabalhos que abrem o seu perfil.</p>
          </header>
          <div className="mt-6">
            <PortfolioManager
              artistId={artistId}
              studioId={artist.studioId}
              items={items}
              styles={styles}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
