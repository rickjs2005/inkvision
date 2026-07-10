import Link from "next/link";
import { ArrowUpRight, Compass, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkReadButton } from "./mark-read-button";

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
  "order.session_done": "O tatuador marcou a sessão como realizada.",
  "artist.added_to_studio": "Você foi adicionado a um estúdio como tatuador.",
};

const dtFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export interface NotificationItem {
  id: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

/**
 * Lista de notificações com roteamento por tipo — compartilhada entre o
 * painel (cliente/dono) e o dashboard do tatuador, para que nenhum papel
 * fique sem a caixa de entrada.
 */
export function NotificationsSection({ notifications }: { notifications: NotificationItem[] }) {
  const hasUnread = notifications.some((n) => n.readAt === null);

  return (
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
            const payload = n.payload as { orderId?: string; artistId?: string };
            const { orderId, artistId } = payload;
            const text = NOTIF_TEXT[n.type] ?? n.type;
            const unread = n.readAt === null;
            // Notificação do lado do estúdio (tem artistId no payload) leva
            // direto pro pedido na visão do tatuador; do contrário, é uma
            // notificação do cliente e leva pro pedido na visão dele.
            // Vínculo novo de tatuador (sem pedido) leva pra fila do artista.
            const href =
              n.type === "artist.added_to_studio" && artistId
                ? `/artista/${artistId}/pedidos`
                : !orderId
                  ? null
                  : artistId
                    ? `/artista/${artistId}/pedidos/${orderId}`
                    : `/pedidos/${orderId}`;
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
  );
}
