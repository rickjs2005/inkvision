import Link from "next/link";
import { requireActor } from "@/server/auth-context";
import { prisma } from "@inkvision/db";
import { repositories } from "@/server/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seu painel</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pedidos">Meus pedidos</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/conta">Conta</Link>
          </Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Notificações</CardTitle>
          {hasUnread && <MarkReadButton />}
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {notifications.map((n) => {
                const orderId = (n.payload as { orderId?: string }).orderId;
                const text = NOTIF_TEXT[n.type] ?? n.type;
                // Só a notificação do cliente (orçamento) leva à rota do cliente;
                // as do lado do estúdio são navegadas pelo painel do tatuador.
                const href = n.type === "order.quoted" && orderId ? `/pedidos/${orderId}` : null;
                return (
                  <li key={n.id} className="flex items-center gap-2 text-sm">
                    {n.readAt === null && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                    {href ? (
                      <Link href={href} className="hover:underline">
                        {text}
                      </Link>
                    ) : (
                      <span>{text}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {actor.platformRole === "ADMIN" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Administração da plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin">Abrir dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {studios.length > 0 && (
        <div className="mt-6 grid gap-4">
          <h2 className="text-sm font-medium text-muted-foreground">Seus estúdios</h2>
          {studios.map((s) => {
            const role = actor.memberships.find((m) => m.studioId === s.id)?.role ?? "";
            return (
              <Card key={s.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant="neutral">{ROLE_LABEL[role] ?? role}</Badge>
                    {s.status === "PENDING" && <Badge variant="warning">Onboarding pendente</Badge>}
                  </div>
                  <div className="flex gap-2">
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
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/s/${s.slug}`}>Ver página</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {studios.length === 0 && actor.platformRole !== "ADMIN" && (
        <p className="mt-6 text-muted-foreground">
          Explore <Link href="/tatuadores" className="text-primary hover:underline">tatuadores</Link>{" "}
          para começar um projeto. (Pedidos chegam na Sprint 4.)
        </p>
      )}
    </div>
  );
}
