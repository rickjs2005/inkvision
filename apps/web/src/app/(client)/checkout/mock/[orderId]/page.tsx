import { notFound } from "next/navigation";
import { DomainError } from "@inkvision/core";
import { requireActor } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ConfirmButton } from "./confirm-button";

export default async function MockCheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ kind?: string }>;
}) {
  const { orderId } = await params;
  const kind = (await searchParams).kind === "final" ? "FINAL" : "DEPOSIT";
  const actor = await requireActor();

  let order;
  try {
    order = await useCases.getOrderForClient.execute(actor, orderId);
  } catch (e) {
    if (e instanceof DomainError && e.code === "NOT_FOUND") notFound();
    throw e;
  }

  const amountCents =
    kind === "DEPOSIT"
      ? (order.depositCents ?? 0)
      : (order.quoteAmountCents ?? 0) - (order.depositCents ?? 0);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">
            {kind === "DEPOSIT" ? "Pagamento do sinal" : "Pagamento final"}
          </CardTitle>
          <CardDescription>
            {order.artistName} · {order.bodyPart}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="text-4xl font-bold">R$ {(amountCents / 100).toFixed(2)}</p>
          </div>
          <ConfirmButton orderId={orderId} kind={kind} />
        </CardContent>
      </Card>
    </div>
  );
}
