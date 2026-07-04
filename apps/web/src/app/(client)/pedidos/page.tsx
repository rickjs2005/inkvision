import Link from "next/link";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/order/status-badge";

export default async function ClientOrdersPage() {
  const actor = await requireActor();
  const orders = await useCases.listClientOrders.execute(actor);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold">Meus pedidos</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          Você ainda não tem pedidos.{" "}
          <Link href="/tatuadores" className="text-primary hover:underline">
            Encontre um tatuador
          </Link>{" "}
          para começar.
        </p>
      ) : (
        <div className="mt-6 grid gap-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/pedidos/${o.id}`}>
              <Card className="transition-colors hover:border-primary">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-medium">{o.artistName}</p>
                    <p className="text-sm text-muted-foreground">
                      {o.bodyPart}
                      {o.quoteAmountCents != null && ` · R$ ${(o.quoteAmountCents / 100).toFixed(0)}`}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
