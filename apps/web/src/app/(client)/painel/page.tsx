import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

export default async function PainelPage() {
  const actor = await requireActor();

  const [studios, notifications] = await Promise.all([
    actor.memberships.length
      ? prisma.studio.findMany({
          where: { id: { in: actor.memberships.map((m) => m.studioId) } },
          select: { id: true, name: true, slug: true, status: true },
        })
      : Promise.resolve([]),
    repositories.notifications.listForUser(actor.userId, { take: 10 }),
  ]);
  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow">Seu painel</span>
          </div>
          <h1 className="mt-5 font-display text-5xl font-light leading-[0.95] tracking-[-0.025em]">
            Bem-vindo de volta
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
          <p className="py-6 text-sm text-muted-foreground">Nada por aqui ainda.</p>
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
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-5"
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
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/s/${s.slug}`}>Ver página</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {studios.length === 0 && actor.platformRole !== "ADMIN" && (
        <p className="mt-14 text-muted-foreground">
          Explore{" "}
          <Link href="/tatuadores" className="ink-link text-foreground">
            tatuadores
          </Link>{" "}
          para começar um projeto.
        </p>
      )}
    </div>
  );
}
