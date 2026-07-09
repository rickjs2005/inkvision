import type { OrderEvent, OrderStatus } from "@inkvision/core";
import { ORDER_STATUS_LABEL } from "@inkvision/core";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  // O evento mais recente ganha o ponto em vermelhão; os demais ficam em hairline.
  let latestIndex = -1;
  let latestTime = -Infinity;
  events.forEach((e, i) => {
    const t = new Date(e.createdAt).getTime();
    if (t >= latestTime) {
      latestTime = t;
      latestIndex = i;
    }
  });

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Sem histórico ainda.</p>;
  }

  // QUOTED->QUOTED é uma re-orçamento (ver order-state-machine.ts). Para não
  // exibir "Orçado" duas vezes de forma ambígua, distinguimos o primeiro envio
  // de uma revisão contando a ordem cronológica dos eventos QUOTED.
  const quotedChronological = [...events]
    .filter((e) => e.to === "QUOTED")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const quotedRevisionIndexById = new Map(quotedChronological.map((e, i) => [e.id, i]));

  function labelFor(e: OrderEvent): string {
    if (e.to === "QUOTED") {
      const revisionIndex = quotedRevisionIndexById.get(e.id) ?? 0;
      return revisionIndex === 0 ? "Orçamento enviado" : "Orçamento revisado";
    }
    return ORDER_STATUS_LABEL[e.to as OrderStatus];
  }

  return (
    <ol className="relative ml-1 border-l border-border pl-5">
      {events.map((e, i) => {
        const isLatest = i === latestIndex;
        return (
          <li key={e.id} className="relative pb-5 last:pb-0">
            <span
              className={
                isLatest
                  ? "absolute -left-[1.4375rem] top-1 size-2.5 rounded-full bg-primary ring-4 ring-primary/15"
                  : "absolute -left-[1.34375rem] top-1.5 size-1.5 rounded-full border border-border bg-background"
              }
            />
            <p className={isLatest ? "text-sm font-medium text-foreground" : "text-sm text-foreground"}>
              {labelFor(e)}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              {fmt.format(new Date(e.createdAt))}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
