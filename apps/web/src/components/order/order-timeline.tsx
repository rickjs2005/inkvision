import type { OrderEvent, OrderStatus } from "@inkvision/core";
import { ORDER_STATUS_LABEL } from "@inkvision/core";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <ol className="relative ml-3 border-l border-border">
      {events.map((e) => (
        <li key={e.id} className="mb-5 ml-5">
          <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-primary" />
          <p className="text-sm font-medium">{ORDER_STATUS_LABEL[e.to as OrderStatus]}</p>
          <p className="text-xs text-muted-foreground">{fmt.format(new Date(e.createdAt))}</p>
        </li>
      ))}
    </ol>
  );
}
