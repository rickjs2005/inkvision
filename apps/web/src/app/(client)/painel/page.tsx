import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Compass } from "lucide-react";
import { requireActor } from "@/server/auth-context";
import { prisma, withUser } from "@inkvision/db";
import { repositories } from "@/server/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationsSection } from "@/components/order/notifications-section";

const ROLE_LABEL: Record<string, string> = { OWNER: "Dono", MANAGER: "Gerente", ARTIST: "Tatuador" };

/** Papel de maior peso do ator, pro cabeçalho e ordem de prioridade das seções. */
function primaryRole(actor: Awaited<ReturnType<typeof requireActor>>): "ADMIN" | "OWNER" | "ARTIST" | "CLIENT" {
  if (actor.platformRole === "ADMIN") return "ADMIN";
  const roles = actor.memberships.map((m) => m.role);
  if (roles.some((r) => r === "OWNER" || r === "MANAGER")) return "OWNER";
  if (roles.includes("ARTIST")) return "ARTIST";
  return "CLIENT";
}

const HEADER_BY_ROLE: Record<ReturnType<typeof primaryRole>, { eyebrow: string; title: string }> = {
  ADMIN: { eyebrow: "Seu painel", title: "Visão da plataforma" },
  OWNER: { eyebrow: "Seu painel", title: "Seu ateliê" },
  ARTIST: { eyebrow: "Seu painel", title: "Sua agulha, seu painel" },
  CLIENT: { eyebrow: "Seu painel", title: "Bem-vindo de volta" },
};

export default async function PainelPage() {
  const actor = await requireActor();

  const [studios, notifications, ownArtistProfiles, clientOrdersCount] = await Promise.all([
    actor.memberships.length
      ? prisma.studio.findMany({
          where: { id: { in: actor.memberships.map((m) => m.studioId) } },
          select: { id: true, name: true, slug: true, status: true },
        })
      : Promise.resolve([]),
    repositories.notifications.listForUser(actor.userId, { take: 10 }),
    // Papel ARTIST não tem atalho pro próprio perfil hoje — precisa do artistId
    // por estúdio (ArtistProfile é público-legível, leitura direta é segura).
    actor.memberships.some((m) => m.role === "ARTIST")
      ? prisma.artistProfile.findMany({
          where: { userId: actor.userId, studioId: { in: actor.memberships.map((m) => m.studioId) } },
          select: { id: true, studioId: true },
        })
      : Promise.resolve([]),
    // Um tatuador/dono também pode ter pedidos como cliente em outro estúdio —
    // só escondemos "Meus pedidos" quando de fato não há nenhum, pra não
    // levar ninguém pra uma lista vazia que duplica o botão "Pedidos" do estúdio.
    // Order tem RLS (tenant OU cliente dono): sem o contexto de withUser, a
    // política filtra tudo e o count volta 0 — o link sumia em produção.
    withUser(actor.userId, (tx) => tx.order.count({ where: { clientId: actor.userId } })),
  ]);
  const hasClientOrders = clientOrdersCount > 0;
  const role = primaryRole(actor);

  // Tatuador "puro" (não dono/gerente/admin) tem casa própria: o dashboard de
  // artista, com fila, receita, agenda e notificações. Sem este desvio, ele
  // caía num painel com cara de cliente e não sabia que estava logado como
  // profissional.
  if (role === "ARTIST" && ownArtistProfiles[0]) {
    redirect(`/artista/${ownArtistProfiles[0].id}/pedidos`);
  }

  const header = HEADER_BY_ROLE[role];
  const artistIdByStudio = new Map(ownArtistProfiles.map((a) => [a.studioId, a.id]));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow">{header.eyebrow}</span>
          </div>
          <h1 className="mt-5 font-display text-5xl font-light leading-[0.95] tracking-[-0.025em]">
            {header.title}
          </h1>
        </div>
        {hasClientOrders && (
          <Button variant="outline" size="sm" asChild>
            <Link href="/pedidos">Meus pedidos</Link>
          </Button>
        )}
      </div>

      <NotificationsSection notifications={notifications} />

      {actor.platformRole === "ADMIN" && (
        <section className="mt-14">
          <div className="border-b border-border pb-3">
            <span className="eyebrow">Administração da plataforma</span>
          </div>
          <div className="flex items-center justify-between py-5">
            <p className="font-display text-lg leading-tight">Dashboard da plataforma</p>
            <Button size="sm" asChild>
              <Link href="/admin">Abrir dashboard</Link>
            </Button>
          </div>
        </section>
      )}

      {studios.length > 0 && (
        <section className="mt-14">
          <div className="border-b border-border pb-3">
            <span className="eyebrow">Seus estúdios</span>
          </div>
          <ul>
            {studios.map((s) => {
              const role = actor.memberships.find((m) => m.studioId === s.id)?.role ?? "";
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-sm border-b border-border py-5 transition-colors hover:bg-muted/40"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-xl leading-tight">{s.name}</span>
                    <Badge variant="neutral">{ROLE_LABEL[role] ?? role}</Badge>
                    {s.status === "PENDING" && <Badge variant="warning">Onboarding pendente</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role === "OWNER" && s.status === "PENDING" && (
                      <Button size="sm" asChild>
                        <Link href={`/estudio/${s.id}/onboarding`}>Completar cadastro</Link>
                      </Button>
                    )}
                    {(role === "OWNER" || role === "MANAGER") && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/estudio/${s.id}/tatuadores`}>Tatuadores</Link>
                      </Button>
                    )}
                    {(role === "OWNER" || role === "MANAGER") && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/estudio/${s.id}/pedidos`}>Todos os pedidos</Link>
                      </Button>
                    )}
                    {role === "OWNER" && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/estudio/${s.id}/planos`}>Pagamentos</Link>
                      </Button>
                    )}
                    {artistIdByStudio.has(s.id) && (
                      <>
                        <Button size="sm" asChild>
                          <Link href={`/artista/${artistIdByStudio.get(s.id)}/pedidos`}>Pedidos</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/artista/${artistIdByStudio.get(s.id)}`}>Meu perfil</Link>
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="ghost" asChild>
                      {/* Estúdio não publicado só aparece na prévia (a página pública é estática, só ACTIVE). */}
                      <Link href={s.status === "ACTIVE" ? `/s/${s.slug}` : `/s/${s.slug}/previa`}>
                        Ver página
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {studios.length === 0 && actor.platformRole !== "ADMIN" && (
        <section className="mt-14 border-t border-border">
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <Compass className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
            <div>
              <p className="eyebrow">Comece um projeto</p>
              <p className="mt-3 font-display text-3xl font-light leading-[1.05] tracking-[-0.02em] sm:text-4xl">
                Sua próxima tatuagem
                <br />
                começa <span className="italic text-primary">aqui</span>
              </p>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Explore tatuadores por estilo, converse no chat e veja a arte na sua pele antes da agulha.
              </p>
            </div>
            <Button asChild>
              <Link href="/tatuadores">
                Explorar tatuadores
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
