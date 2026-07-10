import Link from "next/link";
import { ArrowUpRight, PenTool } from "lucide-react";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/order/status-badge";

export default async function ClientOrdersPage() {
  const actor = await requireActor();
  const orders = await useCases.listClientOrders.execute(actor);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Seus projetos</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.025em]">
          Meus pedidos
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {String(orders.length).padStart(2, "0")} {orders.length === 1 ? "pedido" : "pedidos"}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-5 border-t border-border py-24 text-center">
          <PenTool className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
          <div>
            <p className="eyebrow">Nenhum projeto ainda</p>
            <p className="mt-3 font-display text-3xl font-light leading-[1.05] tracking-[-0.02em] sm:text-4xl">
              Seu primeiro pedido
              <br />
              espera por <span className="italic text-primary">você</span>
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Escolha um artista, aprove a arte no chat e acompanhe cada etapa por aqui.
            </p>
          </div>
          <Button asChild>
            <Link href="/tatuadores">
              Encontrar um tatuador
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-8 border-t border-border">
          {orders.map((o, i) => (
            <li key={o.id}>
              <Link
                href={`/pedidos/${o.id}`}
                className="group grid grid-cols-[2rem_1fr_auto] items-start gap-4 rounded-sm border-b border-border py-5 transition-colors hover:bg-muted/40 sm:gap-6 sm:px-2"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <span className="font-display text-2xl leading-tight transition-colors group-hover:text-primary">
                    {o.artistName}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    <span>{o.bodyPart}</span>
                    {o.quoteAmountCents != null && (
                      <span>R$ {(o.quoteAmountCents / 100).toFixed(0)}</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-3 justify-self-end">
                  <StatusBadge status={o.status} />
                  <ArrowUpRight className="size-5 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
