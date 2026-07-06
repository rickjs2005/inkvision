import Link from "next/link";
import { ArrowUpRight, Compass, Inbox } from "lucide-react";
import { requireActor } from "@/server/auth-context";
import { prisma } from "@inkvision/db";
import { repositories } from "@/server/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkReadButton } from "./mark-read-button";

const ROLE_LABEL: Record<string, string> = { OWNER: "Dono", MANAGER: "Gerente", ARTIST: "Tatuador" };

const NOTIF_TEXT: Record<string, string> = {
  "order.submitted": "Você recebeu um novo pedido.",
  "order.quoted": "Seu pedido recebeu um orçamento.",
  "order.accepted": "O cliente aceitou o orçamento.",
  "order.cancelled": "Um pedido foi cancelado.",
  "payment.deposit_paid": "O sinal foi pago.",
  "payment.final_paid": "O pagamento final foi concluído.",
  "chat.message": "Você tem uma nova mensagem.",
  "design.sent": "O tatuador enviou uma arte para aprovação.",
  "design.approved": "O cliente aprovou a arte.",
  "design.changes": "O cliente pediu ajustes na arte.",
  "simulation.done": "Sua simulação está pronta.",
  "simulation.approved": "O cliente aprovou a simulação.",
  "session.scheduled": "Uma sessão foi agendada.",
  "session.rescheduled": "Uma sessão foi reagendada.",
  "order.reviewed": "Você recebeu uma avaliação.",
};

const dtFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

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

  const [studios, notifications, ownArtistProfiles] = await Promise.all([
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
  ]);
  const hasUnread = notifications.some((n) => n.readAt === null);
  const header = HEADER_BY_ROLE[primaryRole(actor)];
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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pedidos">Meus pedidos</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/conta">Conta</Link>
          </Button>
        </div>
      </div>

      {/* Notificações — lista com hairlines */}
      <section className="mt-14">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="eyebrow">Notificações</span>
          {hasUnread && <MarkReadButton />}
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Inbox className="size-7 text-muted-foreground/50" strokeWidth={1.5} />
            <div>
              <p className="eyebrow">Caixa vazia</p>
              <p className="mt-2 font-display text-2xl font-light leading-tight">Nada por aqui ainda</p>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                Atualizações dos seus pedidos e mensagens vão aparecer aqui.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tatuadores">
                <Compass />
                Explorar tatuadores
              </Link>
            </Button>
          </div>
        ) : (
          <ul>
            {notifications.map((n) => {
              const orderId = (n.payload as { orderId?: string }).orderId;
              const text = NOTIF_TEXT[n.type] ?? n.type;
              const unread = n.readAt === null;
              // Só a notificação do cliente (orçamento) leva à rota do cliente;
              // as do lado do estúdio são navegadas pelo painel do tatuador.
              const href = n.type === "order.quoted" && orderId ? `/pedidos/${orderId}` : null;
              const body = (
                <>
                  <span className="flex w-4 shrink-0 justify-center pt-1.5">
                    {unread ? (
                      <span className="size-2 rounded-full bg-primary" />
                    ) : (
                      <span className="size-1.5 rounded-full bg-border" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={unread ? "text-sm text-foreground" : "text-sm text-muted-foreground"}>
                      {text}
                    </span>
                    <span className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                      {dtFmt.format(new Date(n.createdAt))}
                    </span>
                  </span>
                  {href && (
                    <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                  )}
                </>
              );
              return (
                <li key={n.id} className="border-b border-border">
                  {href ? (
                    <Link href={href} className="group flex gap-3 py-3.5 transition-colors hover:bg-muted/40">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex gap-3 py-3.5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

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
                    {role === "OWNER" && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/estudio/${s.id}/planos`}>Pagamentos</Link>
                      </Button>
                    )}
                    {artistIdByStudio.has(s.id) && (
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/artista/${artistIdByStudio.get(s.id)}`}>Meu perfil</Link>
                      </Button>
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
