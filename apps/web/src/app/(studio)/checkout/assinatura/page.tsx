import { notFound } from "next/navigation";
import { requireActor } from "@/server/auth-context";
import { repositories } from "@/server/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatBRL } from "@/lib/format-currency";
import { ConfirmSubButton } from "./confirm-sub-button";

export default async function SubscriptionCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ studio?: string; plano?: string }>;
}) {
  const sp = await searchParams;
  await requireActor();
  if (!sp.studio || !sp.plano) notFound();

  const plan = await repositories.subscriptions.getPlanBySlug(sp.plano);
  if (!plan) notFound();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md items-center px-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Assinar {plan.name}</CardTitle>
          <CardDescription>
            Até {plan.maxArtists} tatuadores · {plan.aiCreditsMonthly} créditos de IA/mês
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Mensalidade</p>
            <p className="text-4xl font-bold">{formatBRL(plan.priceCents)}</p>
          </div>
          <ConfirmSubButton studioId={sp.studio} planSlug={plan.slug} />
        </CardContent>
      </Card>
    </div>
  );
}
