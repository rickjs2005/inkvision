import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { ArrowUpRight, CalendarClock, Star, Users, Wallet } from "lucide-react";
import { DomainError } from "@inkvision/core";
import { withStudio, withUser } from "@inkvision/db";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { StatusBadge } from "@/components/order/status-badge";
import { NotificationsSection } from "@/components/order/notifications-section";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const brl = (cents: number) =>
  `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

// Agendamentos "ativos" — RESCHEDULED substitui CONFIRMED, os dois contam como sessão marcada.
const UPCOMING_APPOINTMENT_STATUSES = ["CONFIRMED", "RESCHEDULED"] as const;

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-border p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" strokeWidth={1.5} />
        <span className="eyebrow">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-light tabular-nums leading-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default async function ArtistOrdersPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const actor = await requireActor();

  let artist;
  try {
    artist = await useCases.getArtist.execute(artistId, actor);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // A fila e o resumo só dependem do artist já carregado — rodam em paralelo.
  let orders, upcomingAppointments, monthlyRevenueCents, notifications, clientOrdersCount;
  try {
    [orders, [upcomingAppointments, monthlyRevenueCents], notifications, clientOrdersCount] = await Promise.all([
      useCases.listArtistOrders.execute(actor, artist.studioId, artistId),
      // Dentro da transação interativa as queries continuam sequenciais
      // (uma conexão só); o paralelismo é entre a tx e a fila de pedidos.
      withStudio(artist.studioId, async (tx) => {
        const appointments = await tx.appointment.findMany({
          where: {
            artistId,
            status: { in: [...UPCOMING_APPOINTMENT_STATUSES] },
            startsAt: { gte: now },
          },
          orderBy: { startsAt: "asc" },
          take: 5,
          include: { order: { select: { bodyPart: true, client: { select: { name: true } } } } },
        });
        // Receita reconhecida no mês corrente: só pagamentos já confirmados (sinal + final).
        const revenue = await tx.payment.aggregate({
          where: { status: "SUCCEEDED", createdAt: { gte: startOfMonth }, order: { artistId } },
          _sum: { amountCents: true },
        });
        return [appointments, revenue._sum.amountCents ?? 0] as const;
      }),
      // O tatuador puro nunca passa pelo /painel (redirect pra cá) — a caixa
      // de notificações dele mora aqui.
      repositories.notifications.listForUser(actor.userId, { take: 10 }),
      // Tatuador também pode ser cliente em outro estúdio.
      withUser(actor.userId, (tx) => tx.order.count({ where: { clientId: actor.userId } })),
    ]);
  } catch (e) {
    if (e instanceof DomainError && e.code === "FORBIDDEN") notFound();
    throw e;
  }

  const distinctClients = new Set(orders.map((o) => o.clientId)).size;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">{artist.name} · Fila</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          Pedidos recebidos
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {String(orders.length).padStart(2, "0")}{" "}
          {orders.length === 1 ? "pedido" : "pedidos"}
        </p>
      </div>

      {/* Atalhos do tatuador — antes, a agenda só era alcançável pela edição de perfil. */}
      <nav aria-label="Atalhos do tatuador" className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
        <Link
          href={`/artista/${artistId}/agenda`}
          className="ink-link font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Agenda
        </Link>
        <Link
          href={`/artista/${artistId}`}
          className="ink-link font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Editar perfil
        </Link>
        <Link
          href={`/t/${artistId}`}
          className="ink-link font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
        >
          Página pública
        </Link>
        {clientOrdersCount > 0 && (
          <Link
            href="/pedidos"
            className="ink-link font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-primary"
          >
            Pedidos que fiz como cliente
          </Link>
        )}
      </nav>

      {/* Resumo — agendamentos e métricas do tatuador */}
      <section className="mt-10 border-t border-border pt-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            icon={Star}
            label="Nota média"
            value={artist.ratingAvg != null ? artist.ratingAvg.toFixed(1) : "—"}
            hint={`${artist.ratingCount} ${artist.ratingCount === 1 ? "avaliação" : "avaliações"}`}
          />
          <StatTile
            icon={Wallet}
            label="Receita do mês"
            value={brl(monthlyRevenueCents)}
            hint="Pagamentos confirmados"
          />
          <StatTile
            icon={Users}
            label="Clientes atendidos"
            value={String(distinctClients)}
            hint="Total nesse estúdio"
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="size-4" strokeWidth={1.5} />
            <span className="eyebrow">Próximos agendamentos</span>
          </div>
          {upcomingAppointments.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nenhuma sessão agendada.</p>
          ) : (
            <ul className="mt-3">
              {upcomingAppointments.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-3"
                >
                  <div>
                    <p className="text-sm">{a.order.client.name}</p>
                    <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      {a.order.bodyPart}
                    </p>
                  </div>
                  <time className="font-mono text-xs text-muted-foreground">
                    {dateTimeFmt.format(a.startsAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <NotificationsSection notifications={notifications} />

      {orders.length === 0 ? (
        <div className="mt-10 flex flex-col items-start gap-4 border-t border-border pt-10">
          <p className="font-display text-2xl text-muted-foreground">Nenhum pedido ainda.</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Os pedidos chegam pela sua página pública — compartilhe o link e mantenha o
            portfólio em dia para atrair clientes.
          </p>
          <Link
            href={`/t/${artistId}`}
            className="ink-link font-mono text-xs uppercase tracking-widest text-primary"
          >
            Ver minha página pública
          </Link>
        </div>
      ) : (
        <ul className="mt-10 border-t border-border">
          {orders.map((o, i) => (
            <li key={o.id}>
              <Link
                href={`/artista/${artistId}/pedidos/${o.id}`}
                className="group grid grid-cols-[2rem_1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border py-6 transition-colors hover:bg-muted/40 sm:grid-cols-[2.5rem_1.5fr_auto_auto] sm:gap-6 sm:px-2"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <span className="font-display text-2xl leading-tight transition-colors group-hover:text-primary sm:text-3xl">
                    {o.clientName}
                  </span>
                  <span className="mt-1 block font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {o.bodyPart}
                  </span>
                </div>
                <time className="col-start-2 row-start-2 font-mono text-xs text-muted-foreground sm:col-start-auto sm:row-start-auto sm:justify-self-end">
                  {dateFmt.format(o.createdAt)}
                </time>
                <div className="flex items-center gap-4 justify-self-end">
                  <StatusBadge status={o.status} />
                  <ArrowUpRight className="hidden size-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:block" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
