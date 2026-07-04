import { notFound } from "next/navigation";
import { studioRoleAtLeast } from "@inkvision/shared";
import { requireActor } from "@/server/auth-context";
import { repositories } from "@/server/container";
import { prisma } from "@inkvision/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectButton, SubscribeButton } from "./billing-buttons";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const actor = await requireActor();
  const membership = actor.memberships.find((m) => m.studioId === studioId);
  const isOwner = actor.platformRole === "ADMIN" || (membership && studioRoleAtLeast(membership.role, "OWNER"));
  if (!isOwner) notFound();

  const [studio, plans, active] = await Promise.all([
    prisma.studio.findUnique({ where: { id: studioId }, select: { name: true, stripeAccountId: true } }),
    prisma.plan.findMany({ orderBy: { priceCents: "asc" } }),
    repositories.subscriptions.getActiveForStudio(studioId),
  ]);
  if (!studio) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-sm text-muted-foreground">{studio.name}</p>
      <h1 className="text-2xl font-bold">Pagamentos & plano</h1>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Conta de recebimento</CardTitle>
        </CardHeader>
        <CardContent>
          {studio.stripeAccountId ? (
            <div className="flex items-center gap-2">
              <Badge variant="success">Conectada</Badge>
              <span className="text-sm text-muted-foreground">{studio.stripeAccountId}</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Conecte para receber os sinais e pagamentos dos clientes.
              </p>
              <ConnectButton studioId={studioId} />
            </div>
          )}
        </CardContent>
      </Card>

      <h2 className="mt-8 text-lg font-semibold">Planos</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = active?.planSlug === p.slug;
          return (
            <Card key={p.id} className={isCurrent ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  {isCurrent && <Badge variant="success">Atual</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-2xl font-bold">
                  R$ {(p.priceCents / 100).toFixed(0)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                  <li>Até {p.maxArtists} tatuadores</li>
                  <li>{p.aiCreditsMonthly} créditos de IA/mês</li>
                </ul>
                <SubscribeButton studioId={studioId} planSlug={p.slug} current={isCurrent} />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
