import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { studioRoleAtLeast } from "@inkvision/shared";
import { requireActor } from "@/server/auth-context";
import { prisma, withStudio } from "@inkvision/db";
import { StatusBadge } from "@/components/order/status-badge";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function StudioOrdersPage({
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

  // Visão agregada — todos os tatuadores do estúdio, não só um. Query direta
  // (sem caso de uso dedicado ainda) escopada por tenant via withStudio.
  const orders = await withStudio(studioId, (tx) =>
    tx.order.findMany({
      include: {
        artist: { include: { user: { select: { name: true } } } },
        client: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Pedidos · {studio.name}</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          Todos os pedidos
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {String(orders.length).padStart(2, "0")}{" "}
          {orders.length === 1 ? "pedido" : "pedidos"}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-14 border-t border-border pt-10">
          <p className="font-display text-2xl text-muted-foreground">Nenhum pedido ainda.</p>
        </div>
      ) : (
        <ul className="mt-10 border-t border-border">
          {orders.map((o, i) => (
            <li key={o.id}>
              <Link
                href={`/artista/${o.artistId}/pedidos/${o.id}`}
                className="group grid grid-cols-[2rem_1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border py-6 transition-colors hover:bg-muted/40 sm:grid-cols-[2.5rem_1.5fr_auto_auto] sm:gap-6 sm:px-2"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <span className="font-display text-2xl leading-tight transition-colors group-hover:text-primary sm:text-3xl">
                    {o.client.name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <span>{o.bodyPart}</span>
                    <span aria-hidden>·</span>
                    <span>{o.artist.user.name}</span>
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
